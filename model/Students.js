import mongoose from "mongoose"

const {Schema,model} = mongoose

const StudentSchema = new Schema({
   Batch:{
    type:String,
    required: true
   },
   name:{
    type:String,
    required: true
   },
   mobileNumber:{
    type:String,
    required: true
   },
   whatsappNumber:{
    type:String,
    required: true
   },
   email:{
      type:String,
      required: true
   },
   password:{
      type:String,
      required:true
   },
   gender:{
      type:String,
      required:true
   },
   fathername:{
      type:String,
      required:true
   },
   fatherOccupation:{
      type:String,
      required:true
   },
   mothername:{
      type:String,
      required:true
   },
   motherOccupation:{
      type:String,
      required:true
   },
    profilePhoto:{
      type:String,
      default:""
    } ,
   Degree:{
      type:String,
      required:true
   },
   Year_of_passing:{
      type:String,
      required:true
   },
   working:{
      type:String,
      required:true
   },
   workdesc:{
      type:String,
   },
   permanent_address:{
      type:String,
      required:true
   },
   residential_address:{
      type:String,
      required:true
   },
   exams: [{
      examCode: String,
      status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
      },
      result: {
        type: Number,
        default: null
      },
      date: {
        type: Date,
        default: Date.now()
      }
    }]
   
})

const Student = model('Students',StudentSchema)

export default Student