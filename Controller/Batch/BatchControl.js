// POST /api/batch-access/request
import express from 'express';
import StudentBatchAccess from '../../model/StudentBatchAccess.js';
import Batch from '../../model/Batch.js';

const router = express.Router();


//API – Student Request Access to a Batch
// router.post('/api/batch-access/request', async (req, res) => {
export const BatchRequest= async (req, res) => {

  try {
    const { studentId, examCode, batchName } = req.body;

    const existingRequest = await StudentBatchAccess.findOne({ studentId, examCode, batchName });
    if (existingRequest) {
      return res.status(400).json({ message: 'Already requested for this batch' });
    }

    const newRequest = new StudentBatchAccess({ studentId, examCode, batchName });
    await newRequest.save();

    res.json({ message: 'Access request submitted successfully' });
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//API – Admin Approves or Declines
// router.put('/api/batch-access/update', async (req, res) => {
export const BatchAccessUpdate = async (req, res) => {

  try {
    const { studentId, examCode, batchName, status } = req.body;

    const updated = await StudentBatchAccess.findOneAndUpdate(
      { studentId, examCode, batchName },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: `Batch access ${status}` });
  } catch (err) {
    console.error('Admin update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Before Showing Questions to Student — Validate Access
// router.get('/api/student/exam/:examCode/batch/:batchName', async (req, res) => {
export const ShowQuestion = async (req, res) => {
  const { examCode, batchName } = req.params;
  const { studentId } = req.query; // or req.user from auth middleware

  // Check if student has approved access
  const access = await StudentBatchAccess.findOne({ studentId, examCode, batchName });

  if (!access || access.status !== 'approved') {
    return res.status(403).json({ message: 'Access to batch not approved' });
  }

  // Fetch questions for that batch
  const exam = await Batch.findOne({ examCode }).lean();
  const batch = exam.batches.find(b => b.batchName === batchName);

  if (!batch) {
    return res.status(404).json({ message: 'Batch not found' });
  }

  res.json({ batch });
};



// Create a request
export const requestBatchAccess = async (req, res) => {
  try {
    const { studentId, batchName } = req.body;

    // Check if a request already exists for student + batch
    const existing = await StudentBatchAccess.findOne({ studentId, batchName });
    if (existing) return res.status(400).json({ message: 'Request already exists for this batch' });

    const request = new StudentBatchAccess({ studentId, batchName });
    await request.save();
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

export const approveBatchAccess = async (req, res) => {
  try {
    const { studentId, batchName } = req.body;

    const access = await StudentBatchAccess.findOneAndUpdate(
      { studentId, batchName },
      { status: 'approved', updatedAt: Date.now() },
      { new: true }
    );

    if (!access) return res.status(404).json({ message: 'Access request not found' });

    res.status(200).json(access);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

export const getStudentAccessList = async (req, res) => {
  try {
    const { studentId } = req.query;
    const accessList = await StudentBatchAccess.find({ studentId });
    res.status(200).json(accessList);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Get all requests (admin)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await StudentBatchAccess.find()
      .populate('studentId', 'name email mobileNumber')
      .sort({ requestedAt: -1 });

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Update request status
export const updateRequestStatus = async (req, res) => {
  try {
    const { studentId, batchName, status } = req.body;
    const request = await StudentBatchAccess.findOneAndUpdate(
      { studentId, batchName },
      { status },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


// PUT /api/batch-access/update
// router.put('/api/batch-access/update', async (req, res) => {
export const BatchUpdate = async (req, res) => {
  try {
    const { studentId, examCode, batchName, status } = req.body;

    const updated = await StudentBatchAccess.findOneAndUpdate(
      { studentId, examCode, batchName },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: `Batch access ${status}` });
  } catch (err) {
    console.error('Admin update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export default router;
