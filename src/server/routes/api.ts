import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { handleQuery } from "../analysis/executor.js";

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Establish local cache repository for heavy satellite imagery files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /tiff|tif|jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error('Validation Failed: System strictly accepts GeoTIFF or standard image formats.'));
  }
});

// Refactored API routing architecture to handle local spatial files
router.post('/query', upload.array('satellite_images', 2), async (req, res) => {
  try {
    const { nlQuery, aoi } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!nlQuery) {
      return res.status(400).json({ error: "Missing Natural Language Query parameter." });
    }

    // Track physical file references inside your internal execution workspace context
    const localizedContext = {
      imagePaths: files ? files.map(f => f.path) : [],
    };

    // Pass the localized context to the executor (will need to update executor signature to accept it)
    const result = await handleQuery(nlQuery, aoi, localizedContext);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Query Error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
