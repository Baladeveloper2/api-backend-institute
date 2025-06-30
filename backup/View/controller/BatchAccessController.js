// // POST /api/batch-access/request
// import express from 'express';
// import StudentBatchAccess from '../../../model/StudentBatchAccess.js';
// import ExamModel from '../../../model/Exam.js';

// const router = express.Router();


// //API – Student Request Access to a Batch
// export const BatchRequest= async (req, res) => {

//   try {
//     const { studentId, examCode, batchName } = req.body;

//     const existingRequest = await StudentBatchAccess.findOne({ studentId, examCode, batchName });
//     if (existingRequest) {
//       return res.status(400).json({ message: 'Already requested for this batch' });
//     }

//     const newRequest = new StudentBatchAccess({ studentId, examCode, batchName });
//     await newRequest.save();

//     res.json({ message: 'Access request submitted successfully' });
//   } catch (err) {
//     console.error('Request error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// //API – Admin Approves or Declines
// export const BatchAccessUpdate = async (req, res) => {

//   try {
//     const { studentId, examCode, batchName, status } = req.body;

//     const updated = await StudentBatchAccess.findOneAndUpdate(
//       { studentId, examCode, batchName },
//       { status, updatedAt: new Date() },
//       { new: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ message: 'Request not found' });
//     }

//     res.json({ message: `Batch access ${status}` });
//   } catch (err) {
//     console.error('Admin update error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


// // Before Showing Questions to Student — Validate Access
// export const ShowQuestion = async (req, res) => {
//   const { examCode, batchName } = req.params;
//   const { studentId } = req.query; // or req.user from auth middleware

//   // Check if student has approved access
//   const access = await StudentBatchAccess.findOne({ studentId, examCode, batchName });

//   if (!access || access.status !== 'approved') {
//     return res.status(403).json({ message: 'Access to batch not approved' });
//   }

//   // Fetch questions for that batch
//   const exam = await ExamModel.findOne({ examCode }).lean();
//   const batch = exam.batches.find(b => b.batchName === batchName);

//   if (!batch) {
//     return res.status(404).json({ message: 'Batch not found' });
//   }

//   res.json({ batch });
// };



// // Create a request
// export const requestBatchAccess = async (req, res) => {
//   try {
//     const { studentId, examCode, batchName } = req.body;

//     // Avoid duplicate request
//     const existing = await StudentBatchAccess.findOne({ studentId, examCode, batchName });
//     if (existing) return res.status(400).json({ message: 'Request already exists' });

//     const request = new StudentBatchAccess({ studentId, examCode, batchName });
//     await request.save();
//     res.status(201).json(request);
//   } catch (err) {
//     res.status(500).json({ message: 'Server Error', error: err.message });
//   }
// };

// // Get all requests (admin)
// export const getAllRequests = async (req, res) => {
//   try {
//     const requests = await StudentBatchAccess.find().sort({ requestedAt: -1 });
//     res.status(200).json(requests);
//   } catch (err) {
//     res.status(500).json({ message: 'Server Error', error: err.message });
//   }
// };

// // Update request status
// export const updateRequestStatus = async (req, res) => {
//   try {
//     const { studentId, examCode, batchName, status } = req.body;
//     const request = await StudentBatchAccess.findOneAndUpdate(
//       { studentId, examCode, batchName },
//       { status },
//       { new: true }
//     );
//     if (!request) return res.status(404).json({ message: 'Request not found' });
//     res.status(200).json(request);
//   } catch (err) {
//     res.status(500).json({ message: 'Server Error', error: err.message });
//   }
// };

// export default router;
