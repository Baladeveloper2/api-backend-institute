import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionNumber: { type: Number, required: true },
  questionTextEnglish: { type: String, required: true },
  questionTextTamil: { type: String, default: '' },
  ocrTamilRawText: { type: String, default: '' },

  // Main options: A, B, C, D — each one can contain values like "(a,c,d,b)" or "(1,2,3)"
  options: {
    A: { type: String, default: '' },
    B: { type: String, default: '' },
    C: { type: String, default: '' },
    D: { type: String, default: '' }
  },

  // Optional headOptions: used for matching / ordering questions
  headOptions: {
    type: Map,
    of: String,
    default: undefined
  },

  // Optional subOptions (if you're using (a) to (d) as well)
  subOptions: {
    type: Map,
    of: new mongoose.Schema({
      english: { type: String, default: '' },
      tamil: { type: String, default: '' }
    }, { _id: false }),
    default: undefined
  },

  correctOption: {
    type: String,
    enum: ['A', 'B', 'C', 'D'],
    required: true
  }
}, { _id: false });

const batchSchema = new mongoose.Schema({
  batchName: { type: String, required: true },
  questions: [questionSchema]
}, { _id: false });

const examQuestionSchema = new mongoose.Schema({
  examCode: { type: String, required: true },
  examName: { type: String, required: true },
  examDescription: { type: String },
  category: { type: String },
  year: { type: Number },
  month: { type: Number },
  duration: {
    type: Number,
    enum: [0, 30, 60],
    default: 0
  },
  date: { type: Date, default: Date.now },
  batches: [batchSchema]
}, { timestamps: true });

const ExamModel = mongoose.model('Exam-Questions', examQuestionSchema);
export default ExamModel;


// import mongoose from 'mongoose';

// const questionSchema = new mongoose.Schema({
//   questionNumber: { type: Number, required: true },
//   questionTextEnglish: { type: String, required: true },
//   questionTextTamil: { type: String, default: '' },
//   ocrTamilRawText: String, // 🆕 store OCR version
//   options: {
//     A: { type: String,  },
//     B: { type: String,  },
//     C: { type: String,  },
//     D: { type: String, }
//   },
//   correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true }
// }, { _id: false });

// const batchSchema = new mongoose.Schema({
//   batchName: { type: String, required: true },
//   questions: [questionSchema]
// }, { _id: false });

// const examQuestionSchema = new mongoose.Schema({
//   examCode: { type: String, required: true, },
//   examName: { type: String, required: true },
//   examDescription: { type: String },
//   category: { type: String },
//   year: { type: Number },  // Optional if you want to keep year/month
//   month: { type: Number },
//    duration: {
//     type: Number,
//     enum: [0, 30, 60],  
//     default: 0
//   },
//    date: { type: Date, default:Date.now()},   
//   batches: [batchSchema]    // Array of batches, each with questions
// }, { timestamps: true });

// const ExamModel = mongoose.model('Exam-Questions', examQuestionSchema);
// export default ExamModel;



