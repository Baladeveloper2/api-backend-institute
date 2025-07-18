import mongoose from 'mongoose';

const studentBatchAccessSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Students', required: true },
  batchName: { type: String, required: true },
  examCode: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending',
  },
  requestedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const StudentBatchAccess = mongoose.model('StudentBatchAccess', studentBatchAccessSchema);
export default StudentBatchAccess;
