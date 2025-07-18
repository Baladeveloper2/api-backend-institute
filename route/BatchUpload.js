import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import Batch from '../model/Batch.js';
import { extractTextFromImagePDF } from '../utils/pdfOCR.js';
import { cleanTamilText } from '../utils/cleanTamilText.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function extractAnswers(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const answerMap = {};

  for (const line of lines) {
    const match = line.match(/^(\d+)[.)]?\s*\(?([A-D])\)?/);
    if (match) {
      const qNo = parseInt(match[1], 10);
      const option = match[2];
      answerMap[qNo] = option;
    }
  }

  return answerMap;
}

function detectQuestionType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('match the following') || /(\(i\)|\bi\)).*–/.test(text)) return 'match';
  if (lower.includes('assertion') && lower.includes('reason')) return 'assertion';
  if (/true\s*or\s*false/.test(lower)) return 'truefalse';
  if (lower.includes('passage')) return 'passage';
  return 'mcq';
}

function parseQuestions(text, answers = {}) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const tamilRegex = /[\u0B80-\u0BFF]/;
  const questions = [];

  let q = null;
  let passageEnglish = '', passageTamil = '', inPassage = false;

  const isPassageStart = line => /^passage[\s-]*\d*/i.test(line) || /^\u0BAA\u0BA4\u0BCD\u0BA4\u0BBF\s*-?\d*/.test(line);
  const isQuestionStart = line => /^\d+[.)]?\s+/.test(line);
  const isOptionLine = line => /^[\(\[]?[A-D][\)\]]?[.)]?\s+/i.test(line);
  const isSubOptionLine = line => /^[\(\[]?(i{1,3}|iv)[\)\]]?[.)]?\s+/i.test(line);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isPassageStart(line)) {
      passageEnglish = '';
      passageTamil = '';
      inPassage = true;
      continue;
    }

    if (inPassage && !isQuestionStart(line)) {
      if (tamilRegex.test(line)) passageTamil += line + '\n';
      else passageEnglish += line + '\n';
      continue;
    }

    if (inPassage && isQuestionStart(line)) inPassage = false;

    const qMatch = line.match(/^(\d+)[.)]?\s+(.*)/);
    if (qMatch) {
      if (q) questions.push(q);

      const no = parseInt(qMatch[1], 10);
      q = {
        questionNumber: no,
        questionTextEnglish: qMatch[2].trim(),
        questionTextTamil: '',
        ocrTamilRawText: '',
        passage: passageEnglish.trim(),
        passageTamil: passageTamil.trim(),
        options: { A: '', B: '', C: '', D: '' },
        subOptions: { i: '', ii: '', iii: '', iv: '' },
        correctOption: answers[no] && ['A', 'B', 'C', 'D'].includes(answers[no]) ? answers[no] : 'A',
        explanation: '',
        difficulty: 'medium',
        questionType: detectQuestionType(qMatch[2])
      };
      continue;
    }

    // Append multi-line question text
    if (q && !isOptionLine(line) && !isSubOptionLine(line) && !isQuestionStart(line)) {
      if (tamilRegex.test(line)) {
        const cleaned = cleanTamilText(line);
        q.questionTextTamil += (q.questionTextTamil ? ' ' : '') + cleaned;
        q.ocrTamilRawText += (q.ocrTamilRawText ? '\n' : '') + line;
      } else {
        q.questionTextEnglish += ' ' + line;
      }
      continue;
    }

    const optMatch = line.match(/^\(?([A-D])\)?[.)]?\s+(.*)/);
    if (optMatch && q) {
      const key = optMatch[1];
      q.options[key] = optMatch[2].trim();
      continue;
    }

    const subOptMatch = line.match(/^\(?((i{1,3}|iv))\)?[.)]?\s+(.*)/i);
    if (subOptMatch && q) {
      const key = subOptMatch[1].toLowerCase();
      if (q.subOptions[key] !== undefined) {
        q.subOptions[key] = subOptMatch[3].trim();
      }
      continue;
    }
  }

  if (q) questions.push(q);
  return questions;
}

router.post('/upload-exam', upload.fields([
  { name: 'questionPDF', maxCount: 1 },
  { name: 'answerPDF', maxCount: 1 }
]), async (req, res) => {
  try {
    const { batchName, examCode, examName, examDescription, category, year, month, duration } = req.body;

    const qBuffer = req.files['questionPDF'][0].buffer;
    const aBuffer = req.files['answerPDF'][0].buffer;

    let qParsed = await pdfParse(qBuffer, { pdfjs: pdfjsLib });
    let qText = qParsed.text;
    if (qText.length < 100) qText = await extractTextFromImagePDF(qBuffer);

    let aParsed = await pdfParse(aBuffer, { pdfjs: pdfjsLib });
    let aText = aParsed.text;
    if (aText.length < 20) aText = await extractTextFromImagePDF(aBuffer);

    const answers = extractAnswers(aText);
    const parsedQuestions = parseQuestions(qText, answers);

    let batch = await Batch.findOne({ batchName });
    if (!batch) batch = new Batch({ batchName, exams: [] });

    if (batch.exams.some(e => e.examCode === examCode)) {
      return res.status(400).json({ error: 'Exam code already exists' });
    }

    batch.exams.push({
      examCode,
      examName,
      examDescription: examDescription || '',
      category: category || '',
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      duration: [0, 30, 60].includes(Number(duration)) ? Number(duration) : 0,
      questions: parsedQuestions
    });

    await batch.save();

    res.status(200).json({
      message: '✅ Exam uploaded successfully',
      examCode,
      questionCount: parsedQuestions.length
    });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    res.status(500).json({ error: 'Failed to process and upload exam' });
  }
});

router.get("/get-batches", async (req, res) => {
  try {
    const batches = await Batch.find({}, {
      batchName: 1,
      exams: {
        examCode: 1,
        examName: 1,
        duration: 1,
        category: 1,
      }
    });

    res.status(200).json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.get("/exams/:batchName", async (req, res) => {
  try {
    const { batchName } = req.params;

    const batch = await Batch.findOne(
      { batchName },
      {
        exams: {
          examCode: 1,
          examName: 1,
          duration: 1,
          category: 1,
        },
        _id: 0,
      }
    );

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    res.status(200).json(batch.exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ error: "Failed to fetch exams for batch" });
  }
});

router.post('/manual-upload', async (req, res) => {
  try {
    const {
      batchName, // ✅ Add this
      examCode,
      examName,
      examDescription, // ✅ Add this if model has it
      category,
      year,
      month,
      duration,
      questions
    } = req.body;

    // ✅ Validate required fields
    if (!batchName || !examCode || !examName || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const exam = new Batch({
      batchName,         
      examCode,
      examName,
      examDescription,    
      category,
      year,
      month,
      duration,
      questions
    });

    await exam.save();

    res.status(200).json({ message: 'Exam saved successfully' });
  } catch (err) {
    console.error('Error saving exam:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


export default router;



// import express from 'express';
// import multer from 'multer';
// import pdfParse from 'pdf-parse/lib/pdf-parse.js';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
// import Batch from '../model/Batch.js';
// import { extractTextFromImagePDF } from '../utils/pdfOCR.js';
// import { cleanTamilText } from '../utils/cleanTamilText.js';

// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// // ✅ Extract answers from the Answer PDF
// function extractAnswers(text) {
//   const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
//   const answerMap = {};

//   for (const line of lines) {
//     const match = line.match(/^(\d+)[.)]?\s*\(?([A-D])\)?/);
//     if (match) {
//       const qNo = parseInt(match[1], 10);
//       const option = match[2];
//       answerMap[qNo] = option;
//     }
//   }

//   return answerMap;
// }

// // ✅ Detect question type
// function detectQuestionType(text) {
//   const lower = text.toLowerCase();
//   if (lower.includes('match the following')) return 'match';
//   if (lower.includes('assertion') && lower.includes('reason')) return 'assertion';
//   if (lower.includes('true or false') || lower.includes('correct statement')) return 'statement';
//   if (lower.includes('passage')) return 'passage';
//   return 'mcq';
// }

// // ✅ Parse questions from the Question PDF
// function parseQuestions(text, answers = {}) {
//   const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
//   const tamilRegex = /[\u0B80-\u0BFF]/;
//   const questions = [];

//   let q = null;
//   let passageEnglish = '', passageTamil = '', inPassage = false;

//   const isPassageStart = line => /^passage[\s-]*\d*/i.test(line) || /^பத்தி\s*-?\d*/.test(line);
//   const isQuestionStart = line => /^\d+[.)]?\s+/;
//   const isOptionLine = line => /^[\(\[]?[A-D][\)\]]?[.)]?\s+/i.test(line);
//   const isSubOptionLine = line => /^[\(\[]?(i{1,3}|iv)[\)\]]?[.)]?\s+/i.test(line);

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     if (isPassageStart(line)) {
//       passageEnglish = '';
//       passageTamil = '';
//       inPassage = true;
//       continue;
//     }

//     if (inPassage && !isQuestionStart(line)) {
//       if (tamilRegex.test(line)) passageTamil += line + '\n';
//       else passageEnglish += line + '\n';
//       continue;
//     }

//     if (inPassage && isQuestionStart(line)) inPassage = false;

//     const qMatch = line.match(/^(\d+)[.)]?\s+(.*)/);
//     if (qMatch) {
//       if (q) questions.push(q);

//       const no = parseInt(qMatch[1], 10);
//       q = {
//         questionNumber: no,
//         questionTextEnglish: qMatch[2].trim(),
//         questionTextTamil: '',
//         ocrTamilRawText: '',
//         passage: passageEnglish.trim(),
//         passageTamil: passageTamil.trim(),
//         options: { A: '', B: '', C: '', D: '' },
//         subOptions: { i: '', ii: '', iii: '', iv: '' },
//         correctOption: ['A', 'B', 'C', 'D'].includes(answers[no]) ? answers[no] : 'A',
//         explanation: '',
//         difficulty: 'medium',
//         questionType: detectQuestionType(qMatch[2])
//       };
//       continue;
//     }

//     if (q && !isOptionLine(line) && !isSubOptionLine(line) && !isQuestionStart(line)) {
//       if (tamilRegex.test(line)) {
//         const cleaned = cleanTamilText(line);
//         q.questionTextTamil += (q.questionTextTamil ? ' ' : '') + cleaned;
//         q.ocrTamilRawText += (q.ocrTamilRawText ? '\n' : '') + line;
//       } else {
//         q.questionTextEnglish += ' ' + line;
//       }
//       continue;
//     }

//     const optMatch = line.match(/^\(?([A-D])\)?[.)]?\s+(.*)/);
//     if (optMatch && q) {
//       const key = optMatch[1];
//       q.options[key] = optMatch[2].trim();
//       continue;
//     }

//     const subOptMatch = line.match(/^\(?((i{1,3}|iv))\)?[.)]?\s+(.*)/i);
//     if (subOptMatch && q) {
//       const key = subOptMatch[1].toLowerCase(); // i, ii, iii, iv
//       if (q.subOptions.hasOwnProperty(key)) {
//         q.subOptions[key] = subOptMatch[3].trim();
//       }
//       continue;
//     }
//   }

//   if (q) questions.push(q);
//   return questions;
// }

// // ✅ Upload endpoint
// router.post('/upload-exam', upload.fields([
//   { name: 'questionPDF', maxCount: 1 },
//   { name: 'answerPDF', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { batchName, examCode, examName, examDescription, category, year, month, duration } = req.body;

//     const qBuffer = req.files['questionPDF'][0].buffer;
//     const aBuffer = req.files['answerPDF'][0].buffer;

//     let qText = (await pdfParse(qBuffer, { pdfjs: pdfjsLib })).text;
//     if (qText.length < 100) qText = await extractTextFromImagePDF(qBuffer);

//     let aText = (await pdfParse(aBuffer, { pdfjs: pdfjsLib })).text;
//     if (aText.length < 20) aText = await extractTextFromImagePDF(aBuffer);

//     const answers = extractAnswers(aText);
//     const parsedQuestions = parseQuestions(qText, answers);

//     let batch = await Batch.findOne({ batchName });
//     if (!batch) batch = new Batch({ batchName, exams: [] });

//     if (batch.exams.some(e => e.examCode === examCode)) {
//       return res.status(400).json({ error: 'Exam code already exists' });
//     }

//     batch.exams.push({
//       examCode,
//       examName,
//       examDescription: examDescription || '',
//       category: category || '',
//       year: year ? Number(year) : undefined,
//       month: month ? Number(month) : undefined,
//       duration: [0, 30, 60].includes(Number(duration)) ? Number(duration) : 0,
//       questions: parsedQuestions
//     });

//     await batch.save();

//     res.status(200).json({
//       message: '✅ Exam uploaded successfully',
//       examCode,
//       questionCount: parsedQuestions.length
//     });
//   } catch (err) {
//     console.error('❌ Upload failed:', err);
//     res.status(500).json({ error: 'Failed to process and upload exam' });
//   }
// });



// router.get("/get-batches", async (req, res) => {
//   try {
//     const batches = await Batch.find({}, {
//       batchName: 1,
//       exams: {
//         examCode: 1,
//         examName: 1,
//         duration: 1,
//         category: 1,
//       }
//     });

//     res.status(200).json(batches);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch batches' });
//   }
// });

// router.get("/exams/:batchName", async (req, res) => {
//   try {
//     const { batchName } = req.params;

//     const batch = await Batch.findOne(
//       { batchName },
//       {
//         exams: {
//           examCode: 1,
//           examName: 1,
//           duration: 1,
//           category: 1,
//         },
//         _id: 0,
//       }
//     );

//     if (!batch) {
//       return res.status(404).json({ message: "Batch not found" });
//     }

//     res.status(200).json(batch.exams);
//   } catch (error) {
//     console.error("Error fetching exams:", error);
//     res.status(500).json({ error: "Failed to fetch exams for batch" });
//   }
// });


// router.get("/exams/:batchName", async (req, res) => {
//   try {
//     const { batchName } = req.params;

//     const batch = await Batch.findOne(
//       { batchName },
//       {
//         exams: {
//           examCode: 1,
//           examName: 1,
//           duration: 1,
//           category: 1,
//         },
//         _id: 0,
//       }
//     );

//     if (!batch) {
//       return res.status(404).json({ message: "Batch not found" });
//     }

//     res.status(200).json(batch.exams);
//   } catch (error) {
//     console.error("Error fetching exams:", error);
//     res.status(500).json({ error: "Failed to fetch exams for batch" });
//   }
// });

// export default router;

// import express from 'express';
// import multer from 'multer';
// import pdfParse from 'pdf-parse';
// import Batch from '../model/Batch.js';
// import { extractTextFromImagePDF } from '../utils/pdfOCR.js';
// import { cleanTamilText } from '../utils/cleanTamilText.js';
// import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';


// const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });

// function extractAnswers(text) {
//   const tamilMap = { 'அ': 'A', 'ஆ': 'B', 'இ': 'C', 'ஈ': 'D' };
//   return (text.match(/\d+\.\s*([A-Dஅஆஇஈ])/g) || []).map(line => {
//     const match = line.match(/([A-Dஅஆஇஈ])/);
//     return match ? (tamilMap[match[1]] || match[1]) : 'A';
//   });
// }

// function parseQuestions(text, answers = []) {
//   const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
//   const tamilRegex = /[\u0B80-\u0BFF]/;
//   const questions = [];

//   let q = null;
//   let passageEnglish = '', passageTamil = '', inPassage = false;

//   const isPassageStart = (line) => /^passage[\s-]*\d*/i.test(line) || /^பத்தி\s*-?\d*/.test(line);
//   const isQuestionStart = (line) => /^\d+[.)]?\s+/.test(line);

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     // Detect passage
//     if (isPassageStart(line)) {
//       passageEnglish = '';
//       passageTamil = '';
//       inPassage = true;
//       continue;
//     }

//     if (inPassage && !isQuestionStart(line)) {
//       if (tamilRegex.test(line)) passageTamil += line + '\n';
//       else passageEnglish += line + '\n';
//       continue;
//     }

//     if (inPassage && isQuestionStart(line)) {
//       inPassage = false;
//     }

//     const qMatch = line.match(/^(\d+)[.)]?\s+(.*)/);
//     if (qMatch) {
//       if (q) questions.push(q);
//       const no = parseInt(qMatch[1], 10);
//       q = {
//         questionNumber: no,
//         passage: passageEnglish.trim(),
//         passageTamil: passageTamil.trim(),
//         type: passageEnglish || passageTamil ? 'passage' : 'mcq',
//         questionTextEnglish: qMatch[2].trim(),
//         questionTextTamil: '',
//         ocrTamilRawText: '',
//         subOptions: { a: '', b: '', c: '', d: '' },
//         options: { A: '', B: '', C: '', D: '' },
//         correctOption: ['A', 'B', 'C', 'D'].includes(answers[no - 1]) ? answers[no - 1] : 'A'
//       };
//       passageEnglish = '';
//       passageTamil = '';
//       continue;
//     }

//     const subOptMatch = line.match(/^[(\[]?(a|b|c|d|1|2|3|4|i{1,3}|iv|v|vi)[)\]]?[.)]?\s+(.*)/i);
//     if (subOptMatch && q) {
//       const map = { '1': 'a', '2': 'b', '3': 'c', '4': 'd', 'i': 'a', 'ii': 'b', 'iii': 'c', 'iv': 'd' };
//       let key = subOptMatch[1].toLowerCase();
//       key = map[key] || key;
//       if (['a', 'b', 'c', 'd'].includes(key)) {
//         q.subOptions[key] = subOptMatch[2].trim();
//       }
//       continue;
//     }

//     const optMatch = line.match(/^\(?([A-D])\)?[.)]?\s+(.*)/);
//     if (optMatch && q) {
//       const key = optMatch[1];
//       q.options[key] = optMatch[2].trim();
//       continue;
//     }

//     if (q && tamilRegex.test(line)) {
//       const cleaned = cleanTamilText(line);
//       q.questionTextTamil += (q.questionTextTamil ? ' ' : '') + cleaned;
//       q.ocrTamilRawText += (q.ocrTamilRawText ? '\n' : '') + line;
//     }
//   }

//   if (q) questions.push(q);
//   return questions.map(q => ({
//     ...q,
//     correctOption: ['A', 'B', 'C', 'D'].includes(q.correctOption) ? q.correctOption : 'A'
//   }));
// }

// router.post('/upload-exam', upload.fields([
//   { name: 'questionPDF', maxCount: 1 },
//   { name: 'answerPDF', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     const { batchName, examCode, examName, examDescription, category, year, month, duration } = req.body;

//     const qBuffer = req.files['questionPDF'][0].buffer;
//     const aBuffer = req.files['answerPDF'][0].buffer;

//     // Try pdf-parse first
//     let qText = (await pdfParse(qBuffer)).text;
//     if (qText.length < 100) {
//       console.log('Fallback to OCR for question PDF...');
//       qText = await extractTextFromImagePDF(qBuffer);
//     }

//     let aText = (await pdfParse(aBuffer)).text;
//     if (aText.length < 20) {
//       console.log('Fallback to OCR for answer PDF...');
//       aText = await extractTextFromImagePDF(aBuffer);
//     }

//     const answers = extractAnswers(aText);
//     const parsedQuestions = parseQuestions(qText, answers);

//     let batch = await Batch.findOne({ batchName });
//     if (!batch) batch = new Batch({ batchName, exams: [] });

//     if (batch.exams.some(e => e.examCode === examCode)) {
//       return res.status(400).json({ error: 'Exam code already exists' });
//     }

//     batch.exams.push({
//       examCode,
//       examName,
//       examDescription: examDescription || '',
//       category: category || '',
//       year: year ? Number(year) : undefined,
//       month: month ? Number(month) : undefined,
//       duration: [0, 30, 60].includes(Number(duration)) ? Number(duration) : 0,
//       questions: parsedQuestions
//     });

//     await batch.save();
//     res.status(200).json({
//       message: 'Exam uploaded successfully',
//       examCode,
//       questionCount: parsedQuestions.length
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to process and upload exam' });
//   }
// });



// // ✅ Get all batches
// router.get("/get-batches", async (req, res) => {
//   try {
//     const batches = await Batch.find({}, {
//       batchName: 1,
//       exams: {
//         examCode: 1,
//         examName: 1,
//         duration: 1,
//         category: 1,
//       }
//     });

//     res.status(200).json(batches);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch batches' });
//   }
// });

// // ✅ Get exams for a batch
// router.get("/exams/:batchName", async (req, res) => {
//   try {
//     const { batchName } = req.params;

//     const batch = await Batch.findOne(
//       { batchName },
//       {
//         exams: {
//           examCode: 1,
//           examName: 1,
//           duration: 1,
//           category: 1,
//         },
//         _id: 0,
//       }
//     );

//     if (!batch) {
//       return res.status(404).json({ message: "Batch not found" });
//     }

//     res.status(200).json(batch.exams);
//   } catch (error) {
//     console.error("Error fetching exams:", error);
//     res.status(500).json({ error: "Failed to fetch exams for batch" });
//   }
// });

// export default router;