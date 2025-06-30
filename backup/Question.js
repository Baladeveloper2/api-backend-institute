import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  examCode: String,
  questionNumber: Number, 
  questionText: String,
  options: {
    A: String,
    B: String,
    C: String,
    D: String
  },
  correctOption: {
    type: String,
    default: null
  }
});

const examQuestionSchema = new mongoose.Schema({
  examCode: String,
  examName: { type: String },
  examDescription: { type: String },
   category: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  questions: [questionSchema],
  totalAttendees: {
    type: Number,
    default: 0
  },
  passCount: {
    type: Number,
    default: 0
  },
  failCount: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

export const ExamQuestion = mongoose.model('ExamQuestion', examQuestionSchema);

export default ExamQuestion;


