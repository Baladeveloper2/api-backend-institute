import express from "express"
import Authenticate from "../auth/Auth.js";
import Student from "../model/Students.js";
import ExamModel from "../model/Exam.js";
import StudentExamReport from "../model/StudentExamReport.js";
import {LoginAdmin, RegisterAdmin,Logout, AdminReports, ExamDelete, ExamUpdate, GetAllRequests, getStudentExamStatusById } from "../Controller/Admin/AdminControl.js";
import { getStudentAccessList } from "../Controller/Batch/BatchControl.js";


const router = express.Router();


router.post("/Register",RegisterAdmin)
router.post("/Login",LoginAdmin)
router.post('/Logout',Logout)
router.delete('/exam/delete',ExamDelete)
router.put("/exams/update/:examCode", ExamUpdate);
router.get("/GetALLRequests",GetAllRequests)
router.get("/admin/reports", AdminReports);
router.get('/student/:studentId/exam/status',getStudentExamStatusById)
router.get("/request-list", getStudentAccessList);



router.get('/admin/statistics', async (req, res) => {
  try {
    // Fetch total students
    const totalStudents = await Student.countDocuments();

    // Fetch total exams
    const totalExams = await ExamModel.countDocuments();

    // Fetch total completed and pending exams
    const totalCompletedExams = await StudentExamReport.countDocuments({ status: 'completed' });
    const totalPendingExams = await StudentExamReport.countDocuments({ status: 'pending' });

    // Fetch pass/fail data for exams
    const passFailData = await StudentExamReport.aggregate([
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          pass: {
            $cond: { if: { $gte: ['$result', 50] }, then: '$count', else: 0 }
          },
          fail: {
            $cond: { if: { $lt: ['$result', 50] }, then: '$count', else: 0 }
          }
        }
      }
    ]);

    const passCount = passFailData[0]?.pass || 0;
    const failCount = passFailData[0]?.fail || 0;

    // Fetch student attendance (example: assuming student attendance is recorded in your schema)
    const studentAttendance = await StudentExamReport.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startTime" } },
          attended: { $sum: 1 }
        }
      }
    ]);

    // Send response with all aggregated data
    res.json({
      totalStudents,
      totalExams,
      totalCompletedExams,
      totalPendingExams,
      passFailData: {
        pass: passCount,
        fail: failCount
      },
      studentAttendance
    });
  } catch (err) {
    console.error("Error fetching statistics:", err);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

export default router;