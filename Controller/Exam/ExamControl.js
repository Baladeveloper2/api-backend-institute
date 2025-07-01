
import StudentExamReport from '../../model/StudentExamReport.js';
import mongoose from 'mongoose';
import Batch from '../../model/Batch.js';



export const getAllStudentReports = async (req, res) => {
  try {
    const { studentId } = req.params;
    const reports = await StudentExamReport.find({ studentId, status: 'completed' }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching student reports:', error);
    res.status(500).json({ message: 'Failed to load student reports' });
  }
};


export const submittedStudentExam = async (req, res) => {
  try {
    const { examId, studentId, answers, reviewFlags, startTime, endTime } = req.body;

    // Fetch exam and questions
    const exam = await Batch.findById(examId).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const answerDetails = [];
    let correct = 0;
    let wrong = 0;
    let reviewCount = 0;

   for (const question of exam.questions) {
  const qid = question._id.toString();
  const selectedOption = answers[qid];
  const markedForReview = reviewFlags?.[qid] || false;
  const correctOption = question.correctOption;

  const isCorrect = selectedOption === correctOption;
  if (selectedOption) {
    isCorrect ? correct++ : wrong++;
  }
  if (markedForReview) reviewCount++;

  answerDetails.push({
    questionId: question._id, 
    selectedOption: selectedOption || '',
    correctOption,
    isCorrect,
    markedForReview,
  });
}
console.log('Answer detail pushing:', {
  questionId: Questions._id,
  selectedOption,
  correctOption,
});



    const totalQuestions = exam.questions.length;
    const attempted = answerDetails.filter((a) => a.selectedOption).length;
    const unanswered = totalQuestions - attempted;
    const percentageScore = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    const report = await StudentExamReport.create({
      examId,
      examCode: exam.examCode,
      studentId,
      answerDetails,
      totalQuestions,
      attemptedQuestions: attempted,
      unansweredQuestions: unanswered,
      correctAnswers: correct,
      wrongAnswers: wrong,
      reviewedQuestionsCount: reviewCount,
      result: percentageScore,
      status: 'completed',
      startTime,
      endTime,
      durationInMinutes: (new Date(endTime) - new Date(startTime)) / 60000,
    });

    return res.status(201).json({
      message: 'Exam submitted successfully',
      report,
    });
  } catch (error) {
    console.error('Submit Exam Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};


export const ExamReport = async (req, res) => {
  try {
    const {
      examCode,
      studentId,
      totalQuestions,
      answers = {},
      attemptedQuestions,
      unansweredQuestions,
      reviewedQuestionsCount,
      status,
      endTime
    } = req.body;

    if (!examCode || !studentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existingReport = await StudentExamReport.findOne({
      examCode,
      studentId
    });

    if (!existingReport) {
      return res.status(404).json({ message: 'Exam not started or not found' });
    }

    // Optional: Fetch questions to compute result
    const batch = await Batch.findOne({ 'exams.examCode': examCode });
    const exam = batch?.exams?.find(e => e.examCode === examCode);
    const questionMap = {};
    if (exam) {
      for (const q of exam.questions) {
        questionMap[q.questionNumber] = q.correctOption;
      }
    }

    let correctAnswers = 0;
    let wrongAnswers = 0;

    for (const [qNo, selected] of Object.entries(answers)) {
      const correct = questionMap[qNo];
      if (selected === correct) correctAnswers++;
      else wrongAnswers++;
    }

    const result = Math.round((correctAnswers / totalQuestions) * 100);

    // Update fields
    existingReport.answers = answers;
    existingReport.totalQuestions = totalQuestions;
    existingReport.attemptedQuestions = attemptedQuestions;
    existingReport.unansweredQuestions = unansweredQuestions;
    existingReport.reviewedQuestionsCount = reviewedQuestionsCount;
    existingReport.status = status || 'completed';
    existingReport.endTime = endTime ? new Date(endTime) : new Date();
    existingReport.autoSubmitted = false;

    existingReport.correctAnswers = correctAnswers;
    existingReport.wrongAnswers = wrongAnswers;
    existingReport.result = result;

    await existingReport.save();

    return res.status(200).json({ message: '✅ Exam submitted successfully', result });
  } catch (error) {
    console.error('❌ Submit Error:', error);
    return res.status(500).json({ message: 'Server error while submitting exam' });
  }
};


export  const ExamsList = async (req, res) => {
  try {
    const exams = await Batch.find({}, {
      examCode: 1,
      examName: 1,
      examDescription: 1,
      'batches.batchName': 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    res.status(200).json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Failed to fetch exams.' });
  }
}


// 1. Controller: Get Exam Questions by examCode
// /api/exams/questions/${examCode}
export const getExamQuestionsByCodeAndBatch = async (req, res) => {
  const { examCode, batchName } = req.params;

  try {
    const decodedBatchName = decodeURIComponent(batchName).trim().toLowerCase();

    const batch = await Batch.findOne({
      batchName: { $regex: new RegExp(`^${decodedBatchName}$`, 'i') }
    });

    if (!batch) {
      console.log(`Batch "${decodedBatchName}" not found.`);
      return res.status(404).json({ message: 'Batch not found' });
    }

    const exam = batch.exams.find(
      (e) => e.examCode.trim().toLowerCase() === examCode.trim().toLowerCase()
    );

    if (!exam) {
      console.log(`Exam with code "${examCode}" not found in batch "${batchName}".`);
      return res.status(404).json({ message: 'Exam not found in this batch' });
    }

    // Send full question details including _id and subOptions
    const questions = exam.questions.map(q => ({
      _id: q._id,
      questionNumber: q.questionNumber,
      questionTextEnglish: q.questionTextEnglish,
      questionTextTamil: q.questionTextTamil,
      ocrTamilRawText: q.ocrTamilRawText || '',
      passage: q.passage || '',
      passageTamil: q.passageTamil || '',
      options: q.options,
      subOptions: q.subOptions,
      questionType: q.questionType || 'mcq',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
    }));

    return res.status(200).json({
      examId: exam._id, // ✅ required for submission
      examName: exam.examName,
      examDescription: exam.examDescription || '',
      questions,
      examDuration: exam.duration || null,
      batchDuration: exam.duration || null,
    });
  } catch (error) {
    console.error('Error fetching exam questions:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};




// 2. Controller: Submit Student Exam Answers
// Controller to get questions by examCode
export const submitedStudentExam = async (req, res) => {
  const { examCode, studentId, answers } = req.body;
  if (!examCode || !studentId || !answers) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Check if already submitted
    const existingSubmission = await StudentExamReport.findOne({ examCode, studentId });
    if (existingSubmission && existingSubmission.status === 'completed') {
      return res.status(400).json({ message: 'Exam already submitted' });
    }

    // Find exam with questions
    const exam = await Exam.findOne({ examCode });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Flatten all questions (to count total and validate answers)
    const allQuestions = [];
    exam.batches.forEach(batch => {
      batch.questions.forEach(q => {
        allQuestions.push(q);
      });
    });

    const totalQuestions = allQuestions.length;

    // Calculate results
    let attemptedQuestions = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;

    allQuestions.forEach((q) => {
      const ans = answers[q.questionNumber];
      if (ans) {
        attemptedQuestions++;
        if (ans === q.correctOption) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      }
    });

    const unansweredQuestions = totalQuestions - attemptedQuestions;
    const score = correctAnswers;  // or use custom scoring logic

    // Prepare data to save or update
    const examReportData = {
      examCode,
      studentId: mongoose.Types.ObjectId(studentId),
      totalQuestions,
      answers,
      attemptedQuestions,
      unansweredQuestions,
      correctAnswers,
      wrongAnswers,
      result: score,
      status: 'completed',
      endTime: new Date(),
    };

    // If existing submission (incomplete), update it; else create new
    let studentExam = await StudentExamReport.findOne({ examCode, studentId });
    if (studentExam) {
      Object.assign(studentExam, examReportData);
    } else {
      studentExam = new StudentExamReport(examReportData);
    }

    await studentExam.save();

    return res.status(200).json({ message: 'Exam submitted successfully', data: { score, totalQuestions } });
  } catch (error) {
    console.error('Error submitting exam:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


export const getStudentExamReport = async (req, res) => {
  const { studentId, examId } = req.params;

  try {
    const report = await StudentExamReport.findOne({
      studentId,
      examId,
      status: 'completed',
    })

    if (!report) {
      return res.status(404).json({ message: 'Exam report not found' });
    }

    // 🛠️ Manually find exam from Batch since examId is a subdocument
    const batch = await Batch.findOne({ 'exams._id': examId }, { 'exams.$': 1 });
    if (!batch || !batch.exams || batch.exams.length === 0) {
      return res.status(404).json({ message: 'Exam data not found in Batch' });
    }

    const examData = batch.exams[0]; // This is the matching exam

    return res.status(200).json({
      ...report.toObject(),
      examId: examData, 
    });
  } 
  catch (error) {
    console.error('Error fetching student exam report:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};




// 3. Controller: Get Student Exam Submission Status and Score

export const getStudentExamStatus = async (req, res) => {
  const { studentId, examCode } = req.params;

  try {
    const examReport = await StudentExamReport.findOne({ studentId, examCode });

    if (!examReport) {
      return res.status(404).json({ message: 'Exam submission not found' });
    }

    return res.status(200).json({
      isSubmitted: examReport.status === 'completed',
      score: examReport.result,
    });
  } catch (error) {
    console.error('Error fetching exam status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};



export const getAllExamReports = async (req, res) => {
  try {
    const { examId } = req.query;

    const reports = await StudentExamReport.find(examId ? { examId } : {})
      .populate('studentId', 'name email')
      .populate('examId', 'title examCode');

    res.status(200).json(reports);
  } catch (error) {
    console.error('Get Reports Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};



export const submitStudentExams = async (req, res) => {
  try {
    const {
      examId,
      examCode,
      batchName,
      studentId,
      answers,
      reviewedQuestions = [],
      startTime,
      endTime,
      autoSubmitted = false
    } = req.body;

    if (!examId || !examCode || !studentId || !answers) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const examObjectId = new mongoose.Types.ObjectId(examId);

    // 🔍 Find batch
    const batch = await Batch.findOne({ batchName });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // 🔍 Find exam inside batch
    const exam = batch.exams.find(e => e._id.toString() === examObjectId.toString());
    if (!exam) return res.status(404).json({ message: 'Exam not found in batch' });

    const allQuestions = exam.questions;
    const totalQuestions = allQuestions.length;

    // 🧠 Evaluation counters
    let correctAnswersCount = 0;
    let attemptedQuestionsCount = 0;
    let unansweredQuestionsCount = 0;
    let wrongAnswersCount = 0;

    const answerDetails = [];

    for (const question of allQuestions) {
      const qNoStr = question.questionNumber.toString();
      const studentAnswer = answers[qNoStr];

      const isReviewed = reviewedQuestions.includes(qNoStr);
      const isCorrect = studentAnswer === question.correctOption;

      if (studentAnswer) {
        attemptedQuestionsCount++;
        if (isCorrect) correctAnswersCount++;
        else wrongAnswersCount++;
      } else {
        unansweredQuestionsCount++;
      }

      answerDetails.push({
        questionId: question._id,
        selectedOption: studentAnswer || '',
        isCorrect,
        markedForReview: isReviewed
      });
    }

    const reviewedQuestionsCount = reviewedQuestions.length;
    const result = Math.round((correctAnswersCount / totalQuestions) * 100);
    const durationInMinutes = Math.floor(
      (new Date(endTime || Date.now()) - new Date(startTime || Date.now())) / 60000
    );

    // 🔁 Check if report exists
    let studentReport = await StudentExamReport.findOne({
      examId: examObjectId,
      studentId: new mongoose.Types.ObjectId(studentId),
    });

    if (!studentReport) {
      studentReport = new StudentExamReport({
        examId: examObjectId,
        examCode,
        studentId,
        totalQuestions,
        attemptedQuestions: attemptedQuestionsCount,
        unansweredQuestions: unansweredQuestionsCount,
        correctAnswers: correctAnswersCount,
        wrongAnswers: wrongAnswersCount,
        reviewedQuestionsCount,
        answerDetails,
        result,
        status: 'completed',
        startTime: startTime || new Date(),
        endTime: endTime || new Date(),
        durationInMinutes,
        autoSubmitted
      });
    } else {
      // 🔁 Update existing report
      studentReport.attemptedQuestions = attemptedQuestionsCount;
      studentReport.unansweredQuestions = unansweredQuestionsCount;
      studentReport.correctAnswers = correctAnswersCount;
      studentReport.wrongAnswers = wrongAnswersCount;
      studentReport.reviewedQuestionsCount = reviewedQuestionsCount;
      studentReport.answerDetails = answerDetails;
      studentReport.result = result;
      studentReport.status = 'completed';
      studentReport.startTime = startTime || new Date();
      studentReport.endTime = endTime || new Date();
      studentReport.durationInMinutes = durationInMinutes;
      studentReport.autoSubmitted = autoSubmitted;
    }

    await studentReport.save();

    res.status(200).json({
      message: '✅ Exam submitted successfully',
      result,
      correctAnswers: correctAnswersCount,
      wrongAnswers: wrongAnswersCount,
      attemptedQuestions: attemptedQuestionsCount,
      unansweredQuestions: unansweredQuestionsCount,
      durationInMinutes
    });

  } catch (error) {
    console.error('❌ Exam submission error:', error);
    res.status(500).json({ message: 'Failed to submit exam', error: error.message });
  }
};



export const Questions =  async (req, res) => {
  try {
    const { examCode } = req.params; 
    const exam = await Batch.findOne({ examCode });

    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // remove correct options before sending to students
    const questionsForStudent = exam.Batch.map(q => ({
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      options: q.options, 
    }));

    res.status(200).json({ examCode, Batch: questionsForStudent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export const deleteExam = async (req, res) => {
  try {
    const { examCode } = req.params;

    const deleted = await Batch.findOneAndDelete({ examCode });
    if (!deleted) return res.status(404).json({ message: 'Exam not found' });

    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete exam', error: error.message });
  }
};
