import mongoose from "mongoose";
import Question from "./Question.js"; // Ensure the path is correct

const examQuestionSchema = new mongoose.Schema({
  examCode: String,
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved'],
    default: 'pending',
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamQuestion', // Reference to the Question model
  }],
});

const ExamQuestionStatus = mongoose.model('ExamQuestionStatus', examQuestionSchema);

export default ExamQuestionStatus;
