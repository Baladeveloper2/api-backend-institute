import mongoose from "mongoose"

const MongoDB_URL = "mongodb+srv://BALADEVELOPER:DEVELOPER@examination.u1wu29w.mongodb.net/exams?retryWrites=true&w=majority&appName=Examination"


if(!MongoDB_URL){
    throw new Error('Please Define MongoDB URl')
}

let isConnected = false
 const DBConnect = async()=>{
    if(isConnected){
        console.log('using existing DB Connection');
        return;
    }

    try{
const connect = await mongoose.connect(MongoDB_URL)
isConnected  =!!connect.connections[0].readyState
console.log('DB Connected',connect.connection.host);

    }
    catch(error){
        console.error(error);
        process.exit(1);
    }

    mongoose.connection.on('connected',()=>{
        console.log('Mongoose connected to DB');
        
    })
    mongoose.connection.on('error',(err)=>{
        console.error("Mongoose connection error:", err);
    })
    
    mongoose.connection.on("disconnected", () => {
        console.log("Mongoose disconnected.");
      });
}

export default DBConnect