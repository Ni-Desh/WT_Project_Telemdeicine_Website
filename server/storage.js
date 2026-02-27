import dotenv from "dotenv"
import multer from "multer"
import GridFsStoragePkg from "multer-gridfs-storage";
import path from "path";

// 1. Force dotenv to load specifically for this file
dotenv.config({ path: '../.env' });

// Resolves the "GridFsStorage is not a constructor" error
const GridFsStorage = GridFsStoragePkg.GridFsStorage || GridFsStoragePkg;

// 2. Safety Check: If DB_URI is missing, use a local string or alert the console
const dbUrl = process.env.DB_URI;

if (!dbUrl) {
    console.error("❌ ERROR: DB_URI is not defined in your .env file!");
    // You can hardcode your URL here temporarily to test if .env is the problem:
    // const dbUrl = "mongodb+srv://..."; 
}

const storage = new GridFsStorage({
  url: dbUrl,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  file: (req, file) => {
    const fileTypes = ["image/png", "image/jpeg"];

    if (fileTypes.indexOf(file.mimetype) !== -1) {
      return {
        bucketName: "photos",
        filename: `${Date.now()}-${file.originalname}`
      };
    } else {
      return {
        bucketName: "uploads", // It's better to return an object here too
        filename: `${Date.now()}-${file.originalname}`
      };
    }
  }
});

const FileUploader = multer({
  storage: storage,
  limits: {
    fileSize: 2097152 // 2MB
  }
});

export default FileUploader;