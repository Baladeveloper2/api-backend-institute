import express from 'express';
import { deleteExam, ExamReport, ExamsList, getAllExamReports, getExamQuestionsByCodeAndBatch, getStudentExamReport, getStudentExamStatus, submitStudentExams, submittedStudentExam } from '../Controller/Exam/ExamControl.js';
const router = express.Router();



// router.post('/api/student-exams/submit', submittedStudentExam);    
router.get('/api/exam-report', ExamReport);        
router.get('/student/exam/:examCode/:batchName', getExamQuestionsByCodeAndBatch);         // 1. Controller: Get Exam Questions by examCode
// router.post('/studsubmit', submitedStudentExam);        
router.get('/student/exam-report/:examId/:studentId', getStudentExamReport);   
router.get('/student-exam-status/:studentId/:examCode', getStudentExamStatus);        
router.post('/exam-reports', getAllExamReports);        
router.post('/student/submit', submitStudentExams);    
router.get('/exams/list', ExamsList);    
router.delete('/exams/delete/:examCode', deleteExam);    









export default router;
