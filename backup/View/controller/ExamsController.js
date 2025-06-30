
// import StudentExamReport from '../../../model/StudentExamReport.js';
// import Exam from '../../../model/Exam.js';
// import ExamModel from '../../../model/Exam.js';
// import mongoose from 'mongoose';

// // ✅ 1. API: Save Student Answers & Auto-Evaluate
// // POST /api/student-exams/submit

// export const submitStudentExam = async (req, res) => {
//   try {
//     const { examId, studentId, answers, reviewFlags, startTime, endTime } = req.body;

//     // Fetch exam and all related questions
//     const exam = await Exam.findById(examId).populate('questions');
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });

//     const answerDetails = [];
//     let correct = 0, wrong = 0, reviewCount = 0;

//     for (const question of exam.questions) {
//       const qid = question._id.toString();
//       const selectedOption = answers[qid];
//       const markedForReview = reviewFlags?.[qid] || false;

//       const isCorrect = selectedOption === question.correctOption;
//       if (selectedOption) isCorrect ? correct++ : wrong++;
//       if (markedForReview) reviewCount++;

//       answerDetails.push({
//         questionId: qid,
//         selectedOption: selectedOption || '',
//         isCorrect,
//         markedForReview,
//       });
//     }

//     const attempted = answerDetails.filter(a => a.selectedOption).length;
//     const unanswered = exam.questions.length - attempted;

//     const newReport = await StudentExamReport.create({
//       examId,
//       examCode: exam.examCode,
//       studentId,
//       answerDetails,
//       totalQuestions: exam.questions.length,
//       attemptedQuestions: attempted,
//       unansweredQuestions: unanswered,
//       correctAnswers: correct,
//       wrongAnswers: wrong,
//       reviewedQuestionsCount: reviewCount,
//       result: correct,
//       status: 'completed',
//       startTime,
//       endTime,
//       durationInMinutes: (new Date(endTime) - new Date(startTime)) / 60000,
//     });

//     res.status(201).json({ message: 'Exam submitted', report: newReport });
//   } catch (error) {
//     console.error('Submit Exam Error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// export const ExamReport = async (req, res)=> {


//   try {
//     const {
//       examCode,
//       studentId,
//       totalQuestions,
//       answers,
//       attemptedQuestions,
//       unansweredQuestions,
//       reviewedQuestionsCount,
//       status,
//       endTime,
//     } = req.body;

//     if (!examCode || !studentId) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Fetch the student's existing report if exists
//     const existingReport = await StudentExamReport.findOne({
//       examCode,
//       studentId,
//     });

//     if (!existingReport) {
//       return res.status(404).json({ message: 'Exam not started or not found' });
//     }

//     // Calculate correct/wrong answers if answer key is stored
//     // Optional logic (can add later): compare with real answer key to compute `correctAnswers` and `wrongAnswers`

//     // Update report
//     existingReport.answers = answers;
//     existingReport.totalQuestions = totalQuestions;
//     existingReport.attemptedQuestions = attemptedQuestions;
//     existingReport.unansweredQuestions = unansweredQuestions;
//     existingReport.reviewedQuestionsCount = reviewedQuestionsCount;
//     existingReport.status = status;
//     existingReport.endTime = new Date(endTime);
//     existingReport.autoSubmitted = false;

//     // Save the updated report
//     await existingReport.save();

//     return res.status(200).json({ message: 'Exam submitted successfully' });
//   } catch (error) {
//     console.error('Submit Error:', error);
//     return res.status(500).json({ message: 'Server error while submitting exam' });
//   }
// }




// // 1. Controller: Get Exam Questions by examCode
// // /api/exams/questions/${examCode}
// export const getExamQuestionsByCode = async (req, res) => {
//   const { examCode } = req.params;

//   try {
//     // Find exam by examCode and get all questions inside batches
//     const exam = await Exam.findOne({ examCode });
//     if (!exam) {
//       return res.status(404).json({ message: 'Exam not found' });
//     }

//     // Flatten all batch questions into one array with questionNumber, questionText, options
//     const questions = [];
//     exam.batches.forEach(batch => {
//       batch.questions.forEach(q => {
//         questions.push({
//           questionNumber: q.questionNumber,
//           questionText: q.questionTextEnglish,
//           options: q.options,
//         });
//       });
//     });

//     return res.status(200).json({ questions });
//   } catch (error) {
//     console.error('Error fetching exam questions:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // 2. Controller: Submit Student Exam Answers
// // Controller to get questions by examCode
// export const submitedStudentExam = async (req, res) => {
//   const { examCode, studentId, answers } = req.body;

//   if (!examCode || !studentId || !answers) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     // Check if already submitted
//     const existingSubmission = await StudentExamReport.findOne({ examCode, studentId });
//     if (existingSubmission && existingSubmission.status === 'completed') {
//       return res.status(400).json({ message: 'Exam already submitted' });
//     }

//     // Find exam with questions
//     const exam = await Exam.findOne({ examCode });
//     if (!exam) {
//       return res.status(404).json({ message: 'Exam not found' });
//     }

//     // Flatten all questions (to count total and validate answers)
//     const allQuestions = [];
//     exam.batches.forEach(batch => {
//       batch.questions.forEach(q => {
//         allQuestions.push(q);
//       });
//     });

//     const totalQuestions = allQuestions.length;

//     // Calculate results
//     let attemptedQuestions = 0;
//     let correctAnswers = 0;
//     let wrongAnswers = 0;

//     allQuestions.forEach((q) => {
//       const ans = answers[q.questionNumber];
//       if (ans) {
//         attemptedQuestions++;
//         if (ans === q.correctOption) {
//           correctAnswers++;
//         } else {
//           wrongAnswers++;
//         }
//       }
//     });

//     const unansweredQuestions = totalQuestions - attemptedQuestions;
//     const score = correctAnswers;  // or use custom scoring logic

//     // Prepare data to save or update
//     const examReportData = {
//       examCode,
//       studentId: mongoose.Types.ObjectId(studentId),
//       totalQuestions,
//       answers,
//       attemptedQuestions,
//       unansweredQuestions,
//       correctAnswers,
//       wrongAnswers,
//       result: score,
//       status: 'completed',
//       endTime: new Date(),
//     };

//     // If existing submission (incomplete), update it; else create new
//     let studentExam = await StudentExamReport.findOne({ examCode, studentId });
//     if (studentExam) {
//       Object.assign(studentExam, examReportData);
//     } else {
//       studentExam = new StudentExamReport(examReportData);
//     }

//     await studentExam.save();

//     return res.status(200).json({ message: 'Exam submitted successfully', data: { score, totalQuestions } });
//   } catch (error) {
//     console.error('Error submitting exam:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // GET /api/student-exams/:examId/:studentId
// // 📊 2. API: Get Result by Student + Exam
// export const getStudentResult = async (req, res) => {
//   try {
//     const { examId, studentId } = req.params;

//     const report = await StudentExamReport.findOne({ examId, studentId })
//       .populate('examId')
//       .populate('answerDetails.questionId');

//     if (!report) return res.status(404).json({ message: 'Report not found' });

//     res.status(200).json(report);
//   } catch (error) {
//     console.error('Fetch Result Error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };


// // 3. Controller: Get Student Exam Submission Status and Score

// export const getStudentExamStatus = async (req, res) => {
//   const { studentId, examCode } = req.params;

//   try {
//     const examReport = await StudentExamReport.findOne({ studentId, examCode });

//     if (!examReport) {
//       return res.status(404).json({ message: 'Exam submission not found' });
//     }

//     return res.status(200).json({
//       isSubmitted: examReport.status === 'completed',
//       score: examReport.result,
//     });
//   } catch (error) {
//     console.error('Error fetching exam status:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };


// // 3. Admin API: List All Submissions (with filters)

// // GET /api/student-exams?examId=xyz

// export const getAllExamReports = async (req, res) => {
//   try {
//     const { examId } = req.query;

//     const reports = await StudentExamReport.find(examId ? { examId } : {})
//       .populate('studentId', 'name email')
//       .populate('examId', 'title examCode');

//     res.status(200).json(reports);
//   } catch (error) {
//     console.error('Get Reports Error:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };


// export const submitStudentExams = async (req, res) => {
//   try {
//     const { examCode, studentId, answers, startTime, endTime, autoSubmitted = false } = req.body;
//     // answers is an object/map: { '1': 'A', '2': 'B', ... }

//     if (!examCode || !studentId || !answers || !startTime || !endTime) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Fetch exam details to get correct answers and total questions
//     const exam = await ExamModel.findOne({ examCode });
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });

//     // Flatten all questions from all batches into one array
//     const allQuestions = exam.batches.flatMap(batch => batch.questions);

//     const totalQuestions = allQuestions.length;

//     // Calculate results
//     let correctAnswersCount = 0;
//     let attemptedQuestionsCount = 0;
//     let unansweredQuestionsCount = 0;
//     let wrongAnswersCount = 0;
//     const answerMap = new Map();
//     const reviewFlags = new Map(); // For now default false for all questions

//     for (const q of allQuestions) {
//       const qNumStr = q.questionNumber.toString();
//       const studentAnswer = answers[qNumStr];

//       if (studentAnswer) {
//         attemptedQuestionsCount++;
//         answerMap.set(qNumStr, studentAnswer);
//         if (studentAnswer === q.correctOption) {
//           correctAnswersCount++;
//         } else {
//           wrongAnswersCount++;
//         }
//         reviewFlags.set(qNumStr, false);
//       } else {
//         unansweredQuestionsCount++;
//         reviewFlags.set(qNumStr, false);
//       }
//     }

//     // Calculate result percentage
//     const result = Math.round((correctAnswersCount / totalQuestions) * 100);

//     // Calculate duration in minutes
//     const durationInMinutes = Math.floor((new Date(endTime) - new Date(startTime)) / 60000);

//     // Create or update StudentExamReport
//     let studentReport = await StudentExamReport.findOne({ examCode, studentId: mongoose.Types.ObjectId(studentId) });

//     if (!studentReport) {
//       studentReport = new StudentExamReport({
//         examCode,
//         studentId,
//         totalQuestions,
//         answers: answerMap,
//         attemptedQuestions: attemptedQuestionsCount,
//         unansweredQuestions: unansweredQuestionsCount,
//         correctAnswers: correctAnswersCount,
//         wrongAnswers: wrongAnswersCount,
//         reviewedQuestionsCount: 0,  // Initially 0, can update later if student reviews
//         reviewFlags,
//         result,
//         status: 'completed',
//         startTime,
//         endTime,
//         durationInMinutes,
//         autoSubmitted,
//       });
//     } else {
//       // Update existing report (if re-submission allowed)
//       studentReport.answers = answerMap;
//       studentReport.attemptedQuestions = attemptedQuestionsCount;
//       studentReport.unansweredQuestions = unansweredQuestionsCount;
//       studentReport.correctAnswers = correctAnswersCount;
//       studentReport.wrongAnswers = wrongAnswersCount;
//       studentReport.reviewFlags = reviewFlags;
//       studentReport.result = result;
//       studentReport.status = 'completed';
//       studentReport.startTime = startTime;
//       studentReport.endTime = endTime;
//       studentReport.durationInMinutes = durationInMinutes;
//       studentReport.autoSubmitted = autoSubmitted;
//     }

//     await studentReport.save();

//     res.status(200).json({
//       message: 'Exam submitted successfully',
//       result,
//       correctAnswers: correctAnswersCount,
//       wrongAnswers: wrongAnswersCount,
//       attemptedQuestions: attemptedQuestionsCount,
//       unansweredQuestions: unansweredQuestionsCount,
//       durationInMinutes,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to submit exam', error: error.message });
//   }
// };
