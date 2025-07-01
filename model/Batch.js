
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  questionTextEnglish: { type: String, required: true },
  questionTextTamil: { type: String, default: '' },
  ocrTamilRawText: { type: String, default: '' },

  options: {
    A: { type: String, default: '' },
    B: { type: String, default: '' },
    C: { type: String, default: '' },
    D: { type: String, default: '' }
  },

subOptions: {
  i: { type: String, default: '' },
  ii: { type: String, default: '' },
  iii: { type: String, default: '' },
  iv: { type: String, default: '' }
},
  correctOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  },

  questionType: {
    type: String,
    enum: ['mcq', 'assertion-reason', 'match', 'assertion','passage', 'statement'],
    default: 'mcq'
  },
  explanation: { type: String, default: '' },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  }
});

const examSchema = new mongoose.Schema({
  examCode: { type: String, required: true },
  examName: { type: String, required: true },
  examDescription: { type: String, default: '' },
  category: { type: String, default: '' },
  year: { type: Number },
  month: { type: Number },
  duration: {
    type: Number,
    enum: [0, 30, 60],
    default: 0
  },
  questions: [questionSchema],
  createdAt: { type: Date, default: Date.now },

  startTime: Date,
  endTime: Date
});

const batchSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students'
  },
  batchName: { type: String, required: true },
  exams: [examSchema]
});

const Batch = mongoose.model('Batch', batchSchema);

export default Batch;








