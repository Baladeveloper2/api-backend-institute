// import multer from "multer"
// import express from "express"
// import pdfParse from "pdf-parse"
// import Question from "../model/Question.js"

// const storage = multer.memoryStorage()

// const upload = multer({storage})

// const router = express.Router();

// router.post('/upload-questions', upload.single('pdf'), async (req, res) => {
//     try {
//       const { examCode } = req.body;
//       if (!req.file) return res.status(400).json({ message: 'PDF file required' });
  
//       const buffer = req.file.buffer;
//       const pdfData = await pdfParse(buffer);
//       const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);
  
//       const questions = [];
//       let current = null;
//       let questionNumber = 0;
  
//       for (let line of lines) {
//         // Start of a new question
//         if (/^\d+\./.test(line)) {
//           if (current) questions.push(current); // Push previous question
  
//           questionNumber++; // Increment for each new question
//           current = {
//             examCode,
//             questionNumber,
//             questionText: line.replace(/^\d+\.\s*/, '').trim(),
//             options: {}
//           };
//         } else if (/^[A-Da-d]\)/.test(line)) {
//           const key = line[0].toUpperCase();
//           const value = line.slice(2).trim();
//           if (current && ['A', 'B', 'C', 'D'].includes(key)) {
//             current.options[key] = value;
//           }
//         }
//       }
  
//       if (current) questions.push(current); // Push final question
  
//       const result = await Question.insertMany(questions);
  
//       res.status(201).json({
//         message: 'Questions uploaded successfully',
//         examCode,
//         inserted: result.length
//       });
//     } catch (err) {
//       console.error('Error parsing PDF:', err);
//       res.status(500).json({ message: 'Server Error while uploading questions' });
//     }
//   });


//   router.post('/upload-answer-key', upload.single('pdf'), async (req, res) => {
//     try {
//       const { examCode } = req.body;
//       if (!req.file) return res.status(400).json({ message: 'PDF file required' });
  
//       const buffer = req.file.buffer;
//       const pdfData = await pdfParse(buffer);
//       const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);
  
//       // Loop through each line in the PDF and update the answer key for each question
//       for (let i = 0; i < lines.length; i++) {
//         const line = lines[i];
//         const match = /^(\d+)\.\s([A-Da-d])/.exec(line); // Match question number and answer option (e.g. "1. A")
//         if (match) {
//           const questionNumber = parseInt(match[1]);
//           const answer = match[2].toUpperCase();
  
//           // Update the Question document with the correct option
//           const question = await Question.findOneAndUpdate(
//             { examCode, questionNumber }, 
//             { correctOption: answer }, // Update correctOption
//             { new: true } // Return the updated document
//           );
  
//           if (!question) {
//             console.log(`Question with examCode: ${examCode} and questionNumber: ${questionNumber} not found.`);
//           }
//         }
//       }
  
//       res.status(200).json({
//         message: 'Answer key uploaded and updated successfully',
//         examCode
//       });
//     } catch (err) {
//       console.error('Error parsing PDF:', err);
//       res.status(500).json({ message: 'Server Error while uploading answer key' });
//     }
//   }); 
  

//   //   router.post('/upload-answer-key', Authenticate,upload.single('pdf'), async (req, res) => {
// //   try {
// //     const { examCode } = req.body;
// //     if (!req.file) return res.status(400).json({ message: 'PDF file required' });

// //     const buffer = req.file.buffer;
// //     const pdfData = await pdfParse(buffer);
// //     const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

// //     const examDoc = await ExamQuestion.findOne({ examCode });

// //     if (!examDoc) {
// //       return res.status(404).json({ message: 'Exam not found for given examCode' });
// //     }

// //     // Loop through answer key lines and update in-memory questions
// //     for (let line of lines) {
// //       const match = /^(\d+)\.\s*([A-Da-d])/.exec(line); // e.g., "1. A"
// //       if (match) {
// //         const questionNumber = parseInt(match[1]);
// //         const answer = match[2].toUpperCase();

// //         const question = examDoc.questions.find(q => q.questionNumber === questionNumber);
// //         if (question) {
// //           question.correctOption = answer;
// //         } else {
// //           console.log(`Question ${questionNumber} not found in examCode: ${examCode}`);
// //         }
// //       }
// //     }

// //     // Save once after all updates
// //     await examDoc.save();

// //     res.status(200).json({
// //       message: 'Answer key uploaded and updated successfully',
// //       examCode
// //     });
// //   } catch (err) {
// //     console.error('Error parsing PDF:', err);
// //     res.status(500).json({ message: 'Server Error while uploading answer key' });
// //   }
// // });

// // router.post('/upload-questions', Authenticate,upload.single('pdf'), async (req, res) => {
// //   try {
// //     const { examCode } = req.body;
// //     if (!req.file) return res.status(400).json({ message: 'PDF file required' });

// //     const buffer = req.file.buffer;
// //     const pdfData = await pdfParse(buffer);
// //     const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

// //     const questions = [];
// //     let current = null;
// //     let questionNumber = 0;

// //     for (let line of lines) {
// //       // Start of a new question
// //       if (/^\d+\./.test(line)) {
// //         if (current) questions.push(current); // Push previous question

// //         questionNumber++;
// //         current = {
// //           questionNumber,
// //           questionText: line.replace(/^\d+\.\s*/, '').trim(),
// //           options: {}
// //         };
// //       } else if (/^[A-Da-d]\)/.test(line)) {
// //         const key = line[0].toUpperCase();
// //         const value = line.slice(2).trim();
// //         if (current && ['A', 'B', 'C', 'D'].includes(key)) {
// //           current.options[key] = value;
// //         }
// //       }
// //     }

// //     if (current) questions.push(current); // Push final question

// //     // Save in one document with all questions
// //     const result = await ExamQuestion.create({
// //       examCode,
// //       questions
// //     });

// //     res.status(201).json({
// //       message: 'Questions uploaded and grouped successfully',
// //       examCode,
// //       questionCount: result.questions.length,
// //       documentId: result._id
// //     });

// //   } catch (err) {
// //     console.error('Error parsing PDF:', err);
// //     res.status(500).json({ message: 'Server Error while uploading questions' });
// //   }
// // });

// // export const ExamSubmit = async (req, res) => {
// //   try {
// //     const { examCode, studentId, answers } = req.body;

// //     if (!studentId || !examCode) {
// //       return res.status(400).json({ message: "Missing studentId or examCode" });
// //     }

// //     // Find the exam
// //     const exam = await ExamQuestion.findOne({ examCode });
// //     if (!exam) {
// //       return res.status(404).json({ message: "Exam not found" });
// //     }

// //     // Find or create a new student exam report
// //     let studentExam = await StudentExamReport.findOne({ studentId, examCode });
// //     if (!studentExam) {
// //       studentExam = new StudentExamReport({
// //         studentId,
// //         examCode,
// //         startTime: Date.now(),
// //       });
// //     }

// //     // Calculate correct answers
// //     let correctAnswers = 0;
// //     exam.questions.forEach((q) => {
// //       if (answers[q.questionNumber] === q.correctOption) {
// //         correctAnswers++;
// //       }
// //     });

// //     const totalQuestions = exam.questions.length;
// //     const wrongAnswers = totalQuestions - correctAnswers;
// //     const passingCriteria = Math.ceil(totalQuestions * 0.6); // 60% pass
// //     const status = correctAnswers >= passingCriteria ? "passed" : "failed";

// //     // Update the student's exam result
// //     studentExam.result = correctAnswers;
// //     studentExam.status = "completed";
// //     studentExam.correctAnswers = correctAnswers;
// //     studentExam.wrongAnswers = wrongAnswers;
// //     studentExam.endTime = Date.now();

// //     await studentExam.save();

// //     // Update the exam summary counts
// //     exam.totalAttendees = (exam.totalAttendees || 0) + 1;
// //     if (status === "passed") {
// //       exam.passCount = (exam.passCount || 0) + 1;
// //     } else {
// //       exam.failCount = (exam.failCount || 0) + 1;
// //     }

// //     await exam.save();

// //     res.status(200).json({
// //       message: "✅ Exam submitted successfully",
// //       studentExam: {
// //         totalQuestions,
// //         correctAnswers,
// //         wrongAnswers,
// //         result: status,
// //         score: correctAnswers,
// //         status: "completed",
// //       }
// //     });
// //   } catch (error) {
// //     console.error(error);
// //     res.status(500).json({ message: "Internal server error" });
// //   }
// // };

// //////////////


//   export default router;


// function extractQuestionsFromText(text, answers = []) {
//   const lines = text.split(/\r?\n/).filter(Boolean);
//   const questions = [];
//   let currentQuestion = null;
//   let answerIndex = 0;

//   const questionLineRegex = /^(\d+)\.\s+(.+)/;
//   const subOptionRegex = /\(?([a-d]|[i-v]+)\)?\.?\s*([^\n]+)/gi;
//   const mainOptionRegex = /^\(?([A-D])\)?[:.\-\)]?\s*(.+)$/i;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     const qMatch = line.match(questionLineRegex);
//     if (qMatch) {
//       if (currentQuestion) questions.push(currentQuestion);

//       const qNumber = parseInt(qMatch[1]);
//       const qTextEnglish = qMatch[2].trim();
//       const qTextTamil = lines[i + 1]?.trim() || '';
//       i++;

//       const combinedQuestionText = qTextEnglish + ' ' + qTextTamil;

//       // Extract sub-options from question text
//       let subOptions = {};
//       let subMatch;
//       while ((subMatch = subOptionRegex.exec(combinedQuestionText)) !== null) {
//         const key = subMatch[1].toLowerCase();
//         const val = subMatch[2].trim();
//         subOptions[key] = val;
//       }

//       currentQuestion = {
//         questionNumber: qNumber,
//         questionTextEnglish: qTextEnglish,
//         questionTextTamil: qTextTamil,
//         subOptions,
//         options: { A: '', B: '', C: '', D: '' },
//         optionsSubOptions: { A: {}, B: {}, C: {}, D: {} },
//         correctOption: answers[answerIndex] && ['A', 'B', 'C', 'D'].includes(answers[answerIndex]) ? answers[answerIndex] : 'A',
//       };
//       answerIndex++;
//       continue;
//     }

//     // Parse main options A-D
//     const optMatch = line.match(mainOptionRegex);
//     if (currentQuestion && optMatch) {
//       const optLetter = optMatch[1].toUpperCase();
//       let optText = optMatch[2].trim();

//       // Check next line Tamil text for option
//       const nextLine = lines[i + 1]?.trim() || '';
//       const tamilInNextLine = /[\u0B80-\u0BFF]/.test(nextLine);
//       if (tamilInNextLine) {
//         optText = (optText + ' ' + nextLine).trim();
//         i++;
//       }

//       currentQuestion.options[optLetter] = optText;

//       // Extract sub-options inside option text
//       let optSubOptions = {};
//       let optSubMatch;
//       // Reset regex lastIndex before reuse
//       subOptionRegex.lastIndex = 0;
//       while ((optSubMatch = subOptionRegex.exec(optText)) !== null) {
//         const key = optSubMatch[1].toLowerCase();
//         const val = optSubMatch[2].trim();
//         optSubOptions[key] = val;
//       }
//       currentQuestion.optionsSubOptions[optLetter] = optSubOptions;
//     }
//   }

//   if (currentQuestion) questions.push(currentQuestion);

//   // Fill missing options with 'N/A'
//   for (const q of questions) {
//     ['A', 'B', 'C', 'D'].forEach(opt => {
//       if (!q.options[opt]) q.options[opt] = 'N/A';
//       if (!q.optionsSubOptions[opt]) q.optionsSubOptions[opt] = {};
//     });
//     if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
//       q.correctOption = 'A';
//     }
//   }

//   return questions;
// }


// function extractQuestionsFromText(text, answers = []) {
//   const lines = text.split(/\r?\n/).filter(Boolean);
//   const questions = [];
//   let currentQuestion = null;
//   let answerIndex = 0;

//   const questionLineRegex = /^(\d+)\.\s+(.+)/;
//   const subOptionRegex = /\(?([a-d]|[i-v]+)\)?\.?\s*([^\n]+)/gi;
//   const mainOptionRegex = /^\(?([A-D])\)?[:.\-\)]?\s*(.+)$/i;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     const qMatch = line.match(questionLineRegex);
//     if (qMatch) {
//       if (currentQuestion) questions.push(currentQuestion);

//       const qNumber = parseInt(qMatch[1]);
//       const qTextEnglish = qMatch[2].trim();
//       const qTextTamil = lines[i + 1]?.trim() || '';
//       i++;

//       const combinedQuestionText = qTextEnglish + ' ' + qTextTamil;

//       // Extract sub-options from question text
//       let subOptions = {};
//       let subMatch;
//       while ((subMatch = subOptionRegex.exec(combinedQuestionText)) !== null) {
//         const key = subMatch[1].toLowerCase();
//         const val = subMatch[2].trim();
//         subOptions[key] = val;
//       }

//       currentQuestion = {
//         questionNumber: qNumber,
//         questionTextEnglish: qTextEnglish,
//         questionTextTamil: qTextTamil,
//         subOptions,
//         options: { A: '', B: '', C: '', D: '' },
//         optionsSubOptions: { A: {}, B: {}, C: {}, D: {} },
//         correctOption: answers[answerIndex] && ['A', 'B', 'C', 'D'].includes(answers[answerIndex]) ? answers[answerIndex] : 'A',
//       };
//       answerIndex++;
//       continue;
//     }

//     // Parse main options A-D
//     const optMatch = line.match(mainOptionRegex);
//     if (currentQuestion && optMatch) {
//       const optLetter = optMatch[1].toUpperCase();
//       let optText = optMatch[2].trim();

//       // Check next line Tamil text for option
//       const nextLine = lines[i + 1]?.trim() || '';
//       const tamilInNextLine = /[\u0B80-\u0BFF]/.test(nextLine);
//       if (tamilInNextLine) {
//         optText = (optText + ' ' + nextLine).trim();
//         i++;
//       }

//       currentQuestion.options[optLetter] = optText;

//       // Extract sub-options inside option text
//       let optSubOptions = {};
//       let optSubMatch;
//       // Reset regex lastIndex before reuse
//       subOptionRegex.lastIndex = 0;
//       while ((optSubMatch = subOptionRegex.exec(optText)) !== null) {
//         const key = optSubMatch[1].toLowerCase();
//         const val = optSubMatch[2].trim();
//         optSubOptions[key] = val;
//       }
//       currentQuestion.optionsSubOptions[optLetter] = optSubOptions;
//     }
//   }

//   if (currentQuestion) questions.push(currentQuestion);

//   // Fill missing options with 'N/A'
//   for (const q of questions) {
//     ['A', 'B', 'C', 'D'].forEach(opt => {
//       if (!q.options[opt]) q.options[opt] = 'N/A';
//       if (!q.optionsSubOptions[opt]) q.optionsSubOptions[opt] = {};
//     });
//     if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
//       q.correctOption = 'A';
//     }
//   }

//   return questions;
// }


// import mongoose from 'mongoose';

// const optionTextSchema = new mongoose.Schema({
//   english: { type: String, default: '' },
//   tamil: { type: String, default: '' }
// }, { _id: false });

// const questionSchema = new mongoose.Schema({
//   questionNumber: { type: Number, required: true },
//   questionTextEnglish: { type: String, required: true },
//   questionTextTamil: { type: String, default: '' },

//   // Main options text with English only or combined text if needed
//   options: {
//     A: { type: String, default: '' },
//     B: { type: String, default: '' },
//     C: { type: String, default: '' },
//     D: { type: String, default: '' }
//   },

//   // Sub-options for each main option, separate Tamil and English
//   subOptions: {
//     A: { type: optionTextSchema, default: () => ({}) },
//     B: { type: optionTextSchema, default: () => ({}) },
//     C: { type: optionTextSchema, default: () => ({}) },
//     D: { type: optionTextSchema, default: () => ({}) }
//   },

//   correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }
// }, { _id: false });

// const examSchema = new mongoose.Schema({
//   examCode: { type: String, required: true },
//   examName: { type: String, required: true },
//   examDescription: { type: String, default: '' },
//   category: { type: String, default: '' },
//   year: { type: Number },
//   month: { type: Number },
//   duration: {
//     type: Number,
//     enum: [0, 30, 60],
//     default: 0
//   },
//   questions: [questionSchema],
//   createdAt: { type: Date, default: Date.now }
// }, { _id: false });

// const batchSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Students',},
//   batchName: { type: String, required: true },
//   exams: [examSchema]
// });

// const Batch = mongoose.model('Batch', batchSchema);

// export default Batch;




// function extractQuestionsFromText(text, answers = []) {
//   const lines = text.split(/\r?\n/).filter(Boolean);
//   const questions = [];
//   let currentQuestion = null;
//   let answerIndex = 0;

//   const questionLineRegex = /^(\d+)\.\s+(.+)/;
//   const subOptionRegex = /\(?([a-d]|[i-v]+)\)?\.?\s*([^\n]+)/gi;
//   const mainOptionRegex = /^\(?([A-D])\)?[:.\-\)]?\s*(.+)$/i;

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     const qMatch = line.match(questionLineRegex);
//     if (qMatch) {
//       if (currentQuestion) questions.push(currentQuestion);

//       const qNumber = parseInt(qMatch[1]);
//       const qTextEnglish = qMatch[2].trim();
//       const qTextTamil = lines[i + 1]?.trim() || '';
//       i++;

//       const combinedQuestionText = qTextEnglish + ' ' + qTextTamil;

//       // Extract sub-options from question text
//       let subOptions = {};
//       let subMatch;
//       while ((subMatch = subOptionRegex.exec(combinedQuestionText)) !== null) {
//         const key = subMatch[1].toLowerCase();
//         const val = subMatch[2].trim();
//         subOptions[key] = val;
//       }

//       currentQuestion = {
//         questionNumber: qNumber,
//         questionTextEnglish: qTextEnglish,
//         questionTextTamil: qTextTamil,
//         subOptions,
//         options: { A: '', B: '', C: '', D: '' },
//         optionsSubOptions: { A: {}, B: {}, C: {}, D: {} },
//         correctOption: answers[answerIndex] && ['A', 'B', 'C', 'D'].includes(answers[answerIndex]) ? answers[answerIndex] : 'A',
//       };
//       answerIndex++;
//       continue;
//     }

//     // Parse main options A-D
//     const optMatch = line.match(mainOptionRegex);
//     if (currentQuestion && optMatch) {
//       const optLetter = optMatch[1].toUpperCase();
//       let optText = optMatch[2].trim();

//       // Check next line Tamil text for option
//       const nextLine = lines[i + 1]?.trim() || '';
//       const tamilInNextLine = /[\u0B80-\u0BFF]/.test(nextLine);
//       if (tamilInNextLine) {
//         optText = (optText + ' ' + nextLine).trim();
//         i++;
//       }

//       currentQuestion.options[optLetter] = optText;

//       // Extract sub-options inside option text
//       let optSubOptions = {};
//       let optSubMatch;
//       // Reset regex lastIndex before reuse
//       subOptionRegex.lastIndex = 0;
//       while ((optSubMatch = subOptionRegex.exec(optText)) !== null) {
//         const key = optSubMatch[1].toLowerCase();
//         const val = optSubMatch[2].trim();
//         optSubOptions[key] = val;
//       }
//       currentQuestion.optionsSubOptions[optLetter] = optSubOptions;
//     }
//   }

//   if (currentQuestion) questions.push(currentQuestion);

//   // Fill missing options with 'N/A'
//   for (const q of questions) {
//     ['A', 'B', 'C', 'D'].forEach(opt => {
//       if (!q.options[opt]) q.options[opt] = 'N/A';
//       if (!q.optionsSubOptions[opt]) q.optionsSubOptions[opt] = {};
//     });
//     if (!['A', 'B', 'C', 'D'].includes(q.correctOption)) {
//       q.correctOption = 'A';
//     }
//   }

//   return questions;
// }



// routes/upload.js
import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import BatchModel from '../model/Batch.js';
import Batch from '../model/Batch.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


// Extract answers from answer PDF
async function extractAnswersFromAnswerPDF(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  const text = data.text;

  const answerLines = text.match(/^[0-9]+\.\s*([A-D])/gm) || [];
  const answers = answerLines.map(line => {
    const match = line.match(/[A-D]/);
    return match ? match[0] : null;
  });

  if (answers.length === 0) {
    const letterMatches = text.match(/[A-D]/g) || [];
    return letterMatches;
  }

  return answers;
}

function extractQuestionsFromText(text, answers = []) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const questions = [];
  let currentQuestion = null;
  let answerIndex = 0;

  // Matches options like: A) ..., A. ..., A: ..., A - ...
  const optionRegex = /^\(?([A-D])\)?[:.\-\)]?\s*(.+)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match question line: number + dot + English text
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        questionNumber: parseInt(qMatch[1]),
        questionTextEnglish: qMatch[2].trim(),
        questionTextTamil: lines[i + 1]?.trim() || '',
        options: { A: '', B: '', C: '', D: '' },
        correctOption: answers[answerIndex] && ['A','B','C','D'].includes(answers[answerIndex]) ? answers[answerIndex] : 'A'
      };
      answerIndex++;
      i++; // Skip Tamil line assumed to be next line of question
      continue;
    }

    // Match option line
    const optMatch = line.match(optionRegex);
    if (currentQuestion && optMatch) {
      const optionLetter = optMatch[1].toUpperCase();
      let optionText = optMatch[2].trim();

      // Check if next lines are Tamil text (unicode Tamil block)
      // and append until next option or question or end of lines
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        // Stop if next line is next option or question
        if (/^(\d+)\.\s+/.test(nextLine)) break;
        if (/^\(?[A-D]\)?[:.\-\)]?\s*/.test(nextLine)) break;
        // Append Tamil line if it contains Tamil chars
        if (/[\u0B80-\u0BFF]/.test(nextLine)) {
          optionText += ' ' + nextLine;
          j++;
        } else {
          break;
        }
      }

      if (j > i + 1) {
        // Skip the Tamil lines we consumed
        i = j - 1;
      }

      currentQuestion.options[optionLetter] = optionText.trim();
    }
  }

  if (currentQuestion) questions.push(currentQuestion);

  // Ensure every option exists and correctOption is valid
  for (const q of questions) {
    ['A','B','C','D'].forEach(opt => {
      if (!q.options[opt] || q.options[opt].length === 0) {
        q.options[opt] = 'N/A'; // fallback default option text
      }
    });
    if (!['A','B','C','D'].includes(q.correctOption)) {
      q.correctOption = 'A'; // fallback default
    }
  }

  return questions;
}




// POST /upload-exam
router.post('/upload-exam', upload.fields([
  { name: 'questionPDF', maxCount: 1 },
  { name: 'answerPDF', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      batchName,
      examCode,
      examName,
      examDescription,
      category,
      year,
      month,
      duration
    } = req.body;

    if (!batchName || !examCode || !examName) {
      return res.status(400).json({ error: 'Batch name, exam code and name are required' });
    }

    const questionBuffer = req.files['questionPDF'][0].buffer;
    const answerBuffer = req.files['answerPDF'][0].buffer;

    // Extract text and parse
    const questionText = (await pdfParse(questionBuffer)).text;
    const correctAnswers = await extractAnswersFromAnswerPDF(answerBuffer);
    const parsedQuestions = extractQuestionsFromText(questionText, correctAnswers);

    // Validate duration - ensure it's 0, 30, or 60 or default to 0
    const validDuration = [0, 30, 60].includes(Number(duration)) ? Number(duration) : 0;

    // Find batch or create new
    let batch = await BatchModel.findOne({ batchName });
    if (!batch) {
      batch = new BatchModel({ batchName, exams: [] });
    }

    // Check if examCode exists already in this batch to avoid duplicates
    if (batch.exams.some(e => e.examCode === examCode)) {
      return res.status(400).json({ error: 'Exam code already exists in this batch' });
    }

    // Add new exam to batch with new fields
    batch.exams.push({
      examCode,
      examName,
      examDescription,
      category: category || '',
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      duration: validDuration,
      questions: parsedQuestions
    });

    await batch.save();

    res.status(200).json({
      message: 'Exam uploaded successfully',
      batchName,
      examCode,
      questionCount: parsedQuestions.length
    });

  } catch (err) {
    console.error('Upload error:', err);
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


// GET /batch/exams/:batchName
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
    console.error("Error fetching exams for batch:", error);
    res.status(500).json({ error: "Failed to fetch exams for batch" });
  }
});

export default router;
