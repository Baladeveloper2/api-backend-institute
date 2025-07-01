// import Student from "../../../model/Students.js"
// import bcryptjs from "bcryptjs"
// import jwt from "jsonwebtoken"
// import ExamRequest from "../../../model/examRequest.js";
// import StudentExamReport from "../../../model/StudentExamReport.js";
// import ExamQuestion from "../../../model/Question.js";


// export const RegisterStudent = async (req, res) => {
//   try {
//     const {
//       Batch,
//       name,
//       mobileNumber,
//       whatsappNumber,
//       email,
//       password,
//       gender,
//       fathername,
//       fatherOccupation,
//       mothername,
//       motherOccupation,
//       Degree,
//       Year_of_passing,
//       working,
//       workdesc,
//       profilePhoto,
//       permanent_address,
//       residential_address,
//     } = req.body;

//     // Basic validation example
//     if (!email || !password || !name) {
//       return res.status(400).json({ message: "Name, email and password are required." });
//     }

//     // Check if student already exists
//     const existingStudent = await Student.findOne({ email });
//     if (existingStudent) {
//       return res.status(400).json({ message: "Student already registered with this email" });
//     }

//     // Hash password
//     const hashpassword = await bcryptjs.hash(password, 10);

//     // Create student object
//     const student = new Student({
//       Batch,
//       name,
//       mobileNumber,
//       whatsappNumber,
//       email,
//       password: hashpassword,
//       gender,
//       fathername,
//       fatherOccupation,
//       mothername,
//       motherOccupation,
//       Degree,
//       Year_of_passing,
//       working,
//       workdesc,
//       profilePhoto,
//       permanent_address,
//       residential_address,
//     });

//     await student.save();

//     res.status(201).json({
//       message: "Student registered successfully",
//       studentId: student._id,
//     });
//   } catch (error) {
//     console.error("Error registering student:", error);
//     res.status(500).json({ message: "Server error while registering student" });
//   }
// };


// export const GetStudent = async (req, res) => {
//   try {
//     const { User } = req.params;
//     console.log("Requested student ID:", User);

//     const studentdetails = await Student.findById(User); // Correct usage

//     if (!studentdetails) {
//       return res.status(404).json({ message: 'Student not found' });
//     }

//     return res.status(200).json({
//       message: 'Student found',
//       studentdetails,
//     });
//   } catch (error) {
//     console.error("Error fetching student:", error);
//     return res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// export const StudentsList = async(req,res)=>{
//   try{
// const students = await Student.find();
// if(!students){
//     return res.status(400).json({ message: 'Student already registered with this email' });
// }

//     return res.status(200).json({ message: 'Students List',students });

//   }
//   catch(error){
//     console.error(error);
    
//   }
// }
// //Login Student
// export const StudentLogin = async (req,res)=>{
//     try{
//         const {mobileNumber,password} = req.body;
//         const User = await Student.findOne({mobileNumber});
//         if(!User){
//             return res.status(404).json({message:"Invalid Mobile Number"})
//         }

//     const Ispassword = await bcryptjs.compare(password,User.password)
//     if(!Ispassword){
//         return res.status(400).json({message:"Invalid Password"})
//     }

//     const token = jwt.sign({id:User._id,email:User.email,mobileNumber:User.mobileNumber},process.env.Secret_key,{expiresIn:'1d'})

// // const isProduction = process.env.NODE_ENV === "production"

//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: true,       
//       sameSite:  "None",  
//       maxAge: 24 * 60 * 60 * 1000,
//     });
//     return res.status(200).json({message:"Login Successfully",User:User._id,Email:User.email
//     })
//     }
//     catch(error){
//         console.error(error);
//     return res.status(500).json({message:"Internal server error",error})

//     }
// }


// export const StudentLogout = async (req,res)=>{
//   try{
// const Isprotection = process.env.NODE_ENV === "production"
// res.clearCookie('token',{
//   httpOnly:true,
//   sameSite:Isprotection,
//   secure : Isprotection ? "None" : "Lax"
// })

// return res.status(200).json({message:"Logout Successfully"})

//   }
//   catch(error){
//     console.error(error);
    
//   }
// }

// export const ExamRequests = async (req, res) => {
//   try {
//     const { examCode, studentId } = req.body; // ✅ correctly destructure both values

//     const existing = await ExamRequest.findOne({ examCode, studentId });
//     // if (existing) {
//     //   return res.status(400).json({ message: 'Request already submitted' });
//     // }

//     const request = new ExamRequest({
//       examCode,
//       studentId,
//       status: 'pending',
//     });

//     await request.save();

//     res.status(201).json({ message: 'Request submitted successfully' });
//   } catch (error) {
//     console.error('Error submitting exam request:', error);
//     res.status(500).json({ message: 'Server error while submitting request' });
//   }
// };



// // GET /Question/student/:studentId/requests
// export const getStudentRequests = async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     const requests = await ExamRequest.find({ studentId });

//     return res.status(200).json({ requests });
//   } catch (error) {
//     console.error("Error fetching student requests:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// export const getStudentExamStatus = async (req, res) => {
//   try {
//     const { studentId, examCode } = req.params;

//     const studentExam = await StudentExamReport.findOne({ studentId, examCode });

//     if (!studentExam) {
//       return res.status(200).json({ status: "not_started" });
//     }

//     let status = studentExam.status;

//     // Fallback: if started but not marked completed
//     if (!status && studentExam.startTime && !studentExam.endTime) {
//       status = "in_progress";
//     }

//     return res.status(200).json({
//       status: status,
//       result: studentExam.result || 0,
//       correctAnswers: studentExam.correctAnswers || 0,
//       wrongAnswers: studentExam.wrongAnswers || 0,
//       startTime: studentExam.startTime,
//       endTime: studentExam.endTime,
//     });

//   } catch (error) {
//     console.error("Error checking exam status:", error);
//     return res.status(500).json({ message: "Server error" });
//   }
// };





// export const getStudentExamStatusById = async (req, res) => {
//   const { studentId } = req.params

//   try {
//     // Step 1: Count total active exams (optional: use isActive flag if available)
//     const totalExams = await ExamQuestion.countDocuments({ isActive: true })

//     // Step 2: Count how many of those this student has completed
//     const completedExams = await StudentExamReport.countDocuments({
//       studentId,
//       status: 'completed',
//     })

//     return res.status(200).json({
//       completed: completedExams,
//       total: totalExams,
//     })
//   } catch (err) {
//     console.error('Error fetching exam status:', err)
//     res.status(500).json({ error: 'Failed to fetch exam status' })
//   }
// }


// export const getStudentExamResult = async (req, res) => {
//   const { studentId, examCode } = req.params;

//   try {
//     const studentExam = await StudentExamReport.findOne({ studentId, examCode });

//     if (!studentExam) {
//       return res.status(404).json({ message: 'Result not found.' });
//     }

//     const { correctAnswers, wrongAnswers, result, status } = studentExam;

//     return res.status(200).json({
//       result,
//       correctAnswers,
//       wrongAnswers,
//       total: correctAnswers + wrongAnswers,
//       status,
//     });
//   } catch (error) {
//     console.error('Error fetching exam result:', error);
//     return res.status(500).json({ message: 'Server error while fetching result.' });
//   }
// };


// export const StudentUpdate = async(req,res)=>{
//   const {User}  = req.params;

// try{
// const updatestudent = await Student.findByIdAndUpdate(User,{
//   ...req.body
// },{new: true});
//     if (!updatestudent) {
//       return res.status(404).json({ message: 'Updation Failed' });
//     }

// updatestudent.save();
//       return res.status(404).json({ message: 'Updated Successful',updatestudent });

// }
// catch(error){
//   console.error(error);
  
// }
// }



// export const StudentDeleteById =async(req,res)=>{
//   try{
// const studentId = req.params.id;

// const user = await Student.findById(studentId)
// if(!user){
//       return res.status(404).json({ message: 'user not found' });

// }

// const isdeleted = await Student.findByIdAndDelete(studentId)
// if(!isdeleted){
//       return res.status(400).json({ message: 'Deletion Failed' });
// }

//       return res.status(200).json({ message: 'Delete User',isdeleted });

//   }
//   catch(error){
//     console.error(error);
    
//   }
// }
// // GET /api/student-reports
// export const getStudentExamReports = async (req, res) => {
//   try {
//     const reports = await StudentExamReport.find().populate('studentId');

//     const formatted = reports.map((report) => ({
//       studentName: report.studentId?.name || 'N/A',
//       email: report.studentId?.email || 'N/A',
//       examCode: report.examCode,
//       startTime: report.startTime,
//       endTime: report.endTime,
//       correctAnswers: report.correctAnswers,
//       wrongAnswers: report.wrongAnswers,
//       score: report.result,
//       status: report.status,
//     }));

//     res.status(200).json(formatted);
//   } catch (error) {
//     console.error('Error fetching student exam reports:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

