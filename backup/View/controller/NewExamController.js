// import ExamModel from '../../../model/Exam.js';

// // Create a new exam with batches and questions
// export const createExam = async (req, res) => {
//   try {
//     const examData = req.body; // Expect full exam data with batches & questions

//     // Check if examCode already exists
//     const existingExam = await ExamModel.findOne({ examCode: examData.examCode });
//     if (existingExam) {
//       return res.status(400).json({ message: 'Exam with this examCode already exists' });
//     }

//     const newExam = new ExamModel(examData);
//     await newExam.save();

//     res.status(201).json({ message: 'Exam created successfully', exam: newExam });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create exam', error: error.message });
//   }
// };

// // Get exam by examCode (include batches and questions)
// export const getExamByCode = async (req, res) => {
//   try {
//     const { examCode } = req.params;

//     const exam = await ExamModel.findOne({ examCode });
//     if (!exam) return res.status(404).json({ message: 'Exam not found' });

//     res.json(exam);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to fetch exam', error: error.message });
//   }
// };

// // Update exam by examCode (including batches and questions)
// export const updateExam = async (req, res) => {
//   try {
//     const { examCode } = req.params;
//     const updateData = req.body;

//     const updatedExam = await ExamModel.findOneAndUpdate(
//       { examCode },
//       updateData,
//       { new: true }
//     );

//     if (!updatedExam) return res.status(404).json({ message: 'Exam not found' });

//     res.json({ message: 'Exam updated', exam: updatedExam });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update exam', error: error.message });
//   }
// };

// // Delete exam by examCode
// export const deleteExam = async (req, res) => {
//   try {
//     const { examCode } = req.params;

//     const deleted = await ExamModel.findOneAndDelete({ examCode });
//     if (!deleted) return res.status(404).json({ message: 'Exam not found' });

//     res.json({ message: 'Exam deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to delete exam', error: error.message });
//   }
// };
