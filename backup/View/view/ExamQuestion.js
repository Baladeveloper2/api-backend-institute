// import express from 'express';
// import pdfParse from 'pdf-parse';
// import multer from 'multer';
// import ExamQuestion from '../../../model/Question.js'; // use the new model

// const router = express.Router();
// import ExamQuestionstatus from "../../../model/examQuestion.js"
// import ExamRequest from "../../../model/examRequest.js"
// import Authenticate from '../../../auth/Auth.js';
// import StudentExamReport from "../../../model/StudentExamReport.js"
// import { ExamsList, ExamSubmit, getAllExams, Questions } from '../../../Controller/ExamController.js';
// import { AdminReports, ExamDelete, ExamUpdate, GetAllRequests, UnApprovedStudents, UpdateRequestStatus } from '../../../Controller/AdminController.js';
// import { ExamRequests, getStudentExamStatusById, getStudentRequests } from '../../../Controller/StudentController.js';
// const upload = multer(); 



// router.post('/upload-questions', upload.single('pdf'), async (req, res) => {
//   try {
//     const { examCode, examName, examDescription, category, year, month } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: 'PDF file required' });
//     }

//     if (!examCode) {
//       return res.status(400).json({ message: 'examCode are required' });
//     }

//     const buffer = req.file.buffer;
//     const pdfData = await pdfParse(buffer);
//     const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

//     const questions = [];
//     let current = null;
//     let questionNumber = 0;

//     for (let line of lines) {
//       // Start of a new question
//       if (/^\d+\./.test(line)) {
//         if (current) questions.push(current); // Push previous question

//         questionNumber++;
//         current = {
//           questionNumber,
//           questionText: line.replace(/^\d+\.\s*/, '').trim(),
//           options: {}
//         };
//       } else if (/^[A-Da-d]\)/.test(line)) {
//         const key = line[0].toUpperCase();
//         const value = line.slice(2).trim();
//         if (current && ['A', 'B', 'C', 'D'].includes(key)) {
//           current.options[key] = value;
//         }
//       }
//     }

//     if (current) questions.push(current); // Push last question

//     // Save document with exam details
//     const result = await ExamQuestion.create({
//       examCode,
//       examName,
//       examDescription,
//       category, year, month,
//       questions,
//     });

//     res.status(201).json({
//       message: 'Questions uploaded and grouped successfully',
//       examCode,
//       questionCount: result.questions.length,
//       documentId: result._id
//     });

//   } catch (err) {
//     console.error('Error parsing PDF:', err);
//     res.status(500).json({ message: 'Server Error while uploading questions' });
//   }
// });


// router.post('/upload-answer-key', upload.single('pdf'), async (req, res) => {
//   try {
//     const { examCode } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ message: 'PDF file required' });
//     }

//     const buffer = req.file.buffer;
//     const pdfData = await pdfParse(buffer);
//     const lines = pdfData.text.split('\n').map(l => l.trim()).filter(Boolean);

//     const examDoc = await ExamQuestion.findOne({ examCode });

//     if (!examDoc) {
//       return res.status(404).json({ message: 'Exam not found for given examCode' });
//     }

//     for (let line of lines) {
//       const match = /^(\d+)\.\s*([A-Da-d])/.exec(line); // e.g., "1. A"
//       if (match) {
//         const questionNumber = parseInt(match[1]);
//         const answer = match[2].toUpperCase();

//         const question = examDoc.questions.find(q => q.questionNumber === questionNumber);
//         if (question) {
//           question.correctOption = answer;
//         } else {
//           console.log(`Question ${questionNumber} not found in examCode: ${examCode}`);
//         }
//       }
//     }

//     await examDoc.save();

//     res.status(200).json({
//       message: 'Answer key uploaded and updated successfully',
//       examCode
//     });

//   } catch (err) {
//     console.error('Error parsing PDF:', err);
//     res.status(500).json({ message: 'Server Error while uploading answer key' });
//   }
// });

// router.get("/exams/:examCode/questions",Questions);

// // After a student completes the exam and submits their answers
// router.post("/student/exam/submit",ExamSubmit );
// router.get('/all-exams', getAllExams);
// // Update exam
// router.put("/exams/update/:examCode", ExamUpdate);
// // Delete exam
// router.delete("/exams/delete/:examCode", ExamDelete);
// // POST /api/exams/request

// router.post('/exams/request',ExamRequests );


// router.get("/GetALLRequests",GetAllRequests)

// router.get('/exams/unapproved/:studentId',UnApprovedStudents );

// // GET /exams/list
// router.get('/exams/list',ExamsList);

// // PUT /Question/UpdateRequestStatus
// router.put('/UpdateRequestStatus',UpdateRequestStatus);

// // Get all reports (optionally filter by status)
// router.get("/admin/reports", AdminReports);

// router.get("/student/:studentId/requests", getStudentRequests);



// router.get('/student/:studentId/exam/status',getStudentExamStatusById)
// export default router;
