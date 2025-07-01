import { v2 as cloudinary } from 'cloudinary';


 cloudinary.config({ 
        cloud_name: process.env.Cloud_Name, 
        api_key: process.env.API_Secret, 
        api_secret: process.env.API_Key  
    });
export default cloudinary

   
    
 

    
  