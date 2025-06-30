import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';
import { fromBuffer } from 'pdf2pic';
import tmp from 'tmp';
import fs from 'fs/promises';
import { Configuration, OpenAIApi } from 'openai';

import ExamQuestion from '../model/Exam.js';
import { getAllExamReports } from '../Controller/Exam/ExamControl.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Setup OpenAI client with your API key (use env var in real apps)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY || 'YOUR_API_KEY_HERE',
});
const openai = new OpenAIApi(configuration);

// AI Tamil text fixer
async function aiFixTamilText(rawTamil) {
  if (!rawTamil || rawTamil.trim() === '') return rawTamil;

  try {
    const prompt = `
You are an expert Tamil language text corrector. 
Fix any spelling, grammar, or formatting issues in the following Tamil text. 
Return only the corrected Tamil text without extra explanation.

Text to fix:
"""${rawTamil}"""
`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 100,
    });

    const fixedText = completion.data.choices[0].message.content.trim();
    return fixedText || rawTamil;
  } catch (error) {
    console.error('OpenAI Tamil text fix error:', error);
    return rawTamil; // fallback to raw text on error
  }
}

// Extract answers (A-D) from answer PDF text
async function extractAnswersFromAnswerPDF(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;

  const answerLines = text.split(/\r?\n/).filter(Boolean);
  const answers = [];

  for (const line of answerLines) {
    const match = line.match(/^\d+\.\s*([A-D])/i);
    if (match) {
      answers.push(match[1].toUpperCase());
    }
  }

  return answers;
}

// OCR Tamil text from all pages of a PDF buffer
async function extractTamilTextFromPDF(buffer) {
  const tmpDir = tmp.dirSync({ unsafeCleanup: true });
  const tempPath = tmpDir.name;

  const storeAsImage = fromBuffer(buffer, {
    density: 300,
    saveFilename: 'page',
    savePath: tempPath,
    format: 'png',
    width: 1200,
    height: 1600,
  });

  const pdfData = await pdfParse(buffer);
  const numPages = pdfData.numpages || 1;

  let fullText = '';

  try {
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const imageResponse = await storeAsImage(pageNum);
      const imagePath = imageResponse.path;

      const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'tam',
        {
          logger: (m) => console.log(`OCR page ${pageNum}:`, m.status, m.progress),
        }
      );

      fullText += text + '\n';
      await fs.unlink(imagePath);
    }
  } catch (err) {
    console.error('OCR extraction error:', err);
  } finally {
    tmpDir.removeCallback();
  }

  return fullText;
}

// Normalize Tamil text helper
const tamilRegex = /[\u0B80-\u0BFF]/;
const normalizeTamil = (txt) =>
  txt.replace(/[^\u0B80-\u0BFF\s.,;:"'\-?!]/g, '').trim();

// Extract questions from text with Tamil and options, with AI fixing and validations
async function extractQuestionsFromText(text, answers = []) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const questions = [];
  let currentQuestion = null;
  let answerIndex = 0;

  const issues = {
    missingTamilQuestions: [],
    missingOptions: [],
    invalidCorrectOptions: [],
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      if (currentQuestion) questions.push(currentQuestion);

      currentQuestion = {
        questionNumber: parseInt(qMatch[1]),
        questionTextEnglish: qMatch[2].trim(),
        questionTextTamil: '',
        ocrTamilRawText: '',
        options: { A: '', B: '', C: '', D: '' },
        correctOption:
          answers[answerIndex] && ['A', 'B', 'C', 'D'].includes(answers[answerIndex])
            ? answers[answerIndex]
            : 'A',
      };
      answerIndex++;

      const nextLine = lines[i + 1]?.trim() || '';
      if (tamilRegex.test(nextLine)) {
        const rawTamil = nextLine;
        let normalized = normalizeTamil(rawTamil);
        if (!normalized && rawTamil) {
          normalized = await aiFixTamilText(rawTamil);
          console.warn(`AI fixed Tamil text in question ${currentQuestion.questionNumber}`);
        }
        currentQuestion.questionTextTamil = normalized;
        currentQuestion.ocrTamilRawText = rawTamil;
        i++; // skip tamil line
      }
      continue;
    }

    const optMatch = line.match(/^\(?([A-D])\)?\.?\s+(.*)/);
    if (currentQuestion && optMatch) {
      const optionLetter = optMatch[1];
      const englishText = optMatch[2].trim();
      const nextLine = lines[i + 1]?.trim() || '';
      let tamilPart = '';
      let rawTamil = '';

      if (tamilRegex.test(nextLine)) {
        rawTamil = nextLine;
        let normalized = normalizeTamil(rawTamil);
        if (!normalized && rawTamil) {
          normalized = await aiFixTamilText(rawTamil);
          console.warn(`AI fixed Tamil text in option ${optionLetter} of question ${currentQuestion.questionNumber}`);
        }
        tamilPart = normalized;
        i++;
      }

      currentQuestion.options[optionLetter] = tamilPart
        ? `${englishText} ${tamilPart}`.trim()
        : englishText;
    }
  }

  if (currentQuestion) questions.push(currentQuestion);

  for (const q of questions) {
    if (!q.questionTextTamil || q.questionTextTamil.length === 0) {
      issues.missingTamilQuestions.push(q.questionNumber);
      console.warn(`Tamil question missing for question number ${q.questionNumber}`);
    }
    ['A', 'B', 'C', 'D'].forEach((opt) => {
      if (!q.options[opt] || q.options[opt] === '') {
        issues.missingOptions.push({ questionNumber: q.questionNumber, option: opt });
        q.options[opt] = 'N/A';
        console.warn(`Missing option ${opt} for question number ${q.questionNumber}`);
      }
    });
    if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
      issues.invalidCorrectOptions.push(q.questionNumber);
      console.warn(`Invalid correct option for question number ${q.questionNumber}, defaulting to 'A'`);
      q.correctOption = 'A';
    }
  }

  return { questions, issues };
}

// Upload route
router.post(
  '/upload-question-answer-pdf',
  upload.fields([
    { name: 'questionPDF', maxCount: 1 },
    { name: 'answerPDF', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      if (!req.files['questionPDF'] || !req.files['answerPDF']) {
        return res.status(400).json({ error: 'Missing PDF files' });
      }

      const {
        examCode,
        examName,
        examDescription,
        category,
        year,
        date,
        month,
        duration,
        batchName,
      } = req.body;

      const questionBuffer = req.files['questionPDF'][0].buffer;
      const answerBuffer = req.files['answerPDF'][0].buffer;

      // Extract question text from PDF (normal text parse)
      let questionText = (await pdfParse(questionBuffer)).text;

      // Fallback to OCR if Tamil text is missing or poor quality
      const tamilCheckText = 'இராஜாஜி'; // Example Tamil keyword you expect in PDF
      if (!questionText.includes(tamilCheckText) || questionText.length < 100) {
        console.log('⚠️ Tamil text missing or corrupted in PDF, running OCR fallback...');
        questionText = await extractTamilTextFromPDF(questionBuffer);
      }

      // Extract answers from answer PDF
      const correctAnswers = await extractAnswersFromAnswerPDF(answerBuffer);

      // Parse questions & options with AI fixing Tamil text if needed
      const { questions, issues } = await extractQuestionsFromText(questionText, correctAnswers);

      // Save to DB
      const newExam = await ExamQuestion.create({
        examCode,
        examName,
        examDescription,
        category,
        year,
        month,
        duration,
        date,
        batches: [
          {
            batchName,
            questions,
          },
        ],
      });

      res.status(200).json({
        message: 'Questions and answers uploaded successfully.',
        questionCount: questions.length,
        issues,
        exam: newExam,
      });
    } catch (err) {
      console.error('❌ Upload processing failed:', err);
      res.status(500).json({ error: 'Failed to process PDFs', details: err.message || err });
    }
  }
);

router.get('/get-all-exams', getAllExamReports);

export default router;




// // routes/upload.js
// import express from 'express';
// import multer from 'multer';
// import pdfParse from 'pdf-parse';
// import ExamQuestion from '../model/Exam.js';
// import { getAllExamReports } from '../Controller/Exam/ExamControl.js';

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// // Extract answers from answer PDF
// async function extractAnswersFromAnswerPDF(pdfBuffer) {
//   const data = await pdfParse(pdfBuffer);
//   const text = data.text;

//   const answerLines = text.match(/^[0-9]+\.\s*([A-D])/gm) || [];
//   const answers = answerLines.map(line => {
//     const match = line.match(/[A-D]/);
//     return match ? match[0] : null;
//   });

//   if (answers.length === 0) {
//     const letterMatches = text.match(/[A-D]/g) || [];
//     return letterMatches;
//   }

//   return answers;
// }

// // Parse PDF into questions
// function extractQuestionsFromText(text, answers = []) {
//   const lines = text.split(/\r?\n/).filter(Boolean);
//   const questions = [];
//   let currentQuestion = null;
//   let answerIndex = 0;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     const qMatch = line.match(/^(\d+)\.\s+(.+)/);
//     if (qMatch) {
//       if (currentQuestion) questions.push(currentQuestion);
//       currentQuestion = {
//         questionNumber: parseInt(qMatch[1]),
//         questionTextEnglish: qMatch[2].trim(),
//         questionTextTamil: lines[i + 1]?.trim() || '',
//         options: { A: '', B: '', C: '', D: '' },
//         correctOption: answers[answerIndex] && ['A','B','C','D'].includes(answers[answerIndex]) ? answers[answerIndex] : 'A' // default to 'A' if invalid
//       };
//       answerIndex++;
//       i++; // skip tamil line
//       continue;
//     }

//     const optMatch = line.match(/^\(?([A-D])\)?\.?\s+(.*)/);
//     if (currentQuestion && optMatch) {
//       const optionLetter = optMatch[1];
//       const englishText = optMatch[2].trim();
//       const nextLine = lines[i + 1]?.trim() || '';
//       const tamilText = /^[\u0B80-\u0BFF\s]+$/.test(nextLine) ? nextLine : '';

//       if (tamilText) i++;

//       currentQuestion.options[optionLetter] = tamilText
//         ? `${englishText} ${tamilText}`.trim()
//         : englishText;
//     }
//   }

//   if (currentQuestion) questions.push(currentQuestion);

//   // Validate all questions to have all options and correctOption
//   for (const q of questions) {
//     ['A','B','C','D'].forEach(opt => {
//       if (!q.options[opt]) {
//         q.options[opt] = 'N/A'; // fallback default option text
//       }
//     });
//     if (!['A','B','C','D'].includes(q.correctOption)) {
//       q.correctOption = 'A'; // fallback default
//     }
//   }

//   return questions;
// }


// // ✅ POST Route with Batch Upload Logic
// router.post(
//   '/upload-question-answer-pdf',
//   upload.fields([
//     { name: 'questionPDF', maxCount: 1 },
//     { name: 'answerPDF', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       console.log('Files received:', req.files);
//       if (!req.files['questionPDF'] || !req.files['answerPDF']) {
//         return res.status(400).json({ error: 'Missing PDF files' });
//       }

//       const {
//         examCode,
//         examName,
//         examDescription,
//         category,
//         year,
//         date,
//         month,
//         duration,
//         batchName  // Make sure your frontend sends this
//       } = req.body;

//       const questionBuffer = req.files['questionPDF'][0].buffer;
//       const answerBuffer = req.files['answerPDF'][0].buffer;

//       console.log('Question PDF buffer length:', questionBuffer.length);
//       console.log('Answer PDF buffer length:', answerBuffer.length);

//       const questionText = (await pdfParse(questionBuffer)).text;
//       const correctAnswers = await extractAnswersFromAnswerPDF(answerBuffer);

//       const parsedQuestions = extractQuestionsFromText(questionText, correctAnswers);

//       const newExam = await ExamQuestion.create({
//         examCode,
//         examName,
//         examDescription,
//         category,
//         year,
//         month,
//         duration,
//         date,
//         batches: [{
//           batchName,
//           questions: parsedQuestions
//         }]
//       });

//       res.status(200).json({
//         message: 'Questions and highlighted answers uploaded successfully.',
//         count: parsedQuestions.length,
//         exam: newExam
//       });
//     } catch (err) {
//       console.error('PDF processing failed:', err);
//       res.status(500).json({ error: 'Failed to process PDF', details: err.message || err });
//     }
//   }
// );


// // ✅ GET route
// router.get('/get-all-exams', getAllExamReports);

// export default router;
