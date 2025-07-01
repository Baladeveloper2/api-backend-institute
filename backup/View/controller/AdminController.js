// import Admin from "../../../model/Admin.js"
// import bcryptjs from "bcryptjs"
// import jwt from "jsonwebtoken"
// import StudentExamReport from "../../../model/StudentExamReport.js";
// import ExamRequest from "../../../model/examRequest.js";
// import ExamQuestion from "../../../model/Question.js";


// //Register Admin
// export const RegisterAdmin = async(req,res)=>{
// try{
//     const {username,email,password,mobileNumber} = req.body;
// const user = await Admin.findOne({email})
// if(user){
//     return res.status(400).json({message:"User Already Exist"})
// }
// const hashpassword = await bcryptjs.hash(password,10)

// const newUser = new Admin({
//     username,email,password:hashpassword,mobileNumber
// }) 

// await newUser.save();

// return res.status(200).json({message:"Admin Register Successfully",newUser})


// }
// catch(error){
//     console.error(error);
// return res.status(500).json({message:"Internal Server Error",error})
// }
// }

// //Login Admin
// export const LoginAdmin = async(req,res)=>{
// try{
// const {email,password} = req.body;
// const user = await Admin.findOne({email})
// if(!user){
//     return res.status(404).json({message:"User Not Exist"})
// }
// const IsPassword = await bcryptjs.compare(password,user.password)
// if(!IsPassword){
//     return res.status(400).json({message:"Invalid password"})
// }
// const token = jwt.sign({id:user._id,email:user.email},process.env.Secret_key,{expiresIn:'1d'})
//       res.cookie("token", token, {
//       httpOnly: true,
//       secure: true,       
//       sameSite:  "None",  
//       maxAge: 24 * 60 * 60 * 1000,
//     });

// return res.status(200).json({message:"Login Successfully",user:{id: user._id,email:user.email}})

// }
// catch(error){
//     console.error(error);
    
// }
// }


// export const Logout = async (req,res)=>{
//     try{
// const isProduction  = process.env.NODE_ENV  === 'production';

//     res.clearCookie('token',{
//     httpOnly:true,
//     secure:isProduction,
//     sameSite:isProduction ? "None": "Lax"
// })

// return res.status(200).json({message:"Logout Successfully"})
//     }
//     catch(error){
//         console.error(error);
//         return res.status(500).json({ error: "Internal server error" });    
//     }
// }

// export const UpdateRequestStatus = async (req, res) => {
//   const { requestId, status } = req.body;

//   if (!['approved', 'declined'].includes(status)) {
//     return res.status(400).json({ message: 'Invalid status value.' });
//   }

//   try {
//     const updated = await ExamRequest.findByIdAndUpdate(
//       requestId,
//       { status },
//       { new: true }
//     );
//     if (!updated) return res.status(404).json({ message: 'Request not found.' });

//     res.status(200).json({ message: `Request ${status}.`, request: updated });
//   } catch (error) {
//     console.error('Error updating request:', error);
//     res.status(500).json({ message: 'Failed to update request.' });
//   }
// }


// export const AdminReports = async (req, res) => {
//   try {
//     const { status } = req.query;

//     const filter = status ? { status } : {};
//     const reports = await StudentExamReport.find(filter)
//       .populate("studentId", "name email")
//       .sort({ startTime: -1 });

//     res.json(reports);
//   } catch (err) {
//     res.status(500).json({ message: "Failed to fetch reports" });
//   }
// }

// // Example controller to get all requests with name and email
// export const GetAllRequests = async (req, res) => {
//   const requests = await ExamRequest.find()
//     .populate('studentId', 'name email') // this will pull name & email from Students collection
//     .sort({ createdAt: -1 });

//   res.status(200).json({ message: 'Requesters', requests });
// };


// export const UnApprovedStudents = async (req, res) => {
//   const { studentId } = req.params;

//   try {
//     // Find all exam requests for this student
//     const requestedExamCodes = await ExamRequest.find({ studentId }).distinct('examCode');

//     // Find all exams that are not in the requested list
//     const unapprovedExams = await Exam.find({
//       examCode: { $nin: requestedExamCodes }
//     });

//     res.status(200).json(unapprovedExams);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching unapproved exams', error });
//   }
// }

// export const ExamDelete = async (req, res) => {
//   const { examCode } = req.params;

//   try {
//     const exam = await ExamQuestion.findOneAndDelete({ examCode });
//     if (!exam) {
//       return res.status(404).json({ message: "Exam not found" });
//     }

//     res.status(200).json({ message: "Exam deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting exam", error);
//     res.status(500).json({ message: "Failed to delete exam" });
//   }
// }


// export const ExamUpdate = async (req, res) => {
//   const { examCode } = req.params;
//   const { examName, examDescription } = req.body;

//   try {
//     const exam = await ExamQuestion.findOne({ examCode });
//     if (!exam) {
//       return res.status(404).json({ message: "Exam not found" });
//     }

//     exam.examName = examName;
//     exam.examDescription = examDescription;
//     await exam.save();

//     res.status(200).json(exam);
//   } catch (error) {
//     console.error("Error updating exam", error);
//     res.status(500).json({ message: "Failed to update exam" });
//   }
// }




// // PUT /api/batch-access/update
// // router.put('/api/batch-access/update', async (req, res) => {
// export const BatchUpdate = async (req, res) => {
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
