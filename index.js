
import express from "express";
import DBConnect from "./config/DBConfig.js";
import Student from "./route/StudentRoute.js";
import Admin from "./route/AdminRoutes.js";
import Question from "./route/ExamsRoute.js";
import Batch from "./route/BatchRoute.js";
import BatchUpload from "./route/BatchUpload.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import UploadRoute from "./route/upload.js"
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://institute-website-snowy.vercel.app",
      "http://localhost:5173",
      "https://insitute.vercel.app",
      "https://insitute-raminstitute-exams-projects.vercel.app",
      "https://frontend-institute.vercel.app",
      "https://institute-amber.vercel.app",
      'https://institute-exam.vercel.app'

    ],
    credentials: true 
  })
);

// Routes

app.use("/Admin", Admin);
app.use("/Question", Question);
app.use("/api", UploadRoute);
app.use("/batch", Batch);
app.use("/Student", Student);

app.use('/Batch',BatchUpload)
// Default Route
app.get("/", (req, res) => {
  res.send("Running backend");
});

// Start Server
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
  DBConnect();
});
