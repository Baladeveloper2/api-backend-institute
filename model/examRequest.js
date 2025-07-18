import mongoose from 'mongoose';

const examRequestSchema = new mongoose.Schema({
  examCode: {
    type: String,
    required: true,
  },
  studentId: {
   type: mongoose.Schema.Types.ObjectId,
   ref: 'Students'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',  // The default is 'pending' since the request is not yet processed
  },
}, { timestamps: true });  // This adds createdAt and updatedAt fields automatically

const ExamRequest = mongoose.model('ExamRequest', examRequestSchema);

export default ExamRequest;
