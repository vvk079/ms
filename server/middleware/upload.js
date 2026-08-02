// middleware/upload.js
// Multer configured with in-memory storage so we can forward buffers straight to
// ImageKit (no local disk writes). Restricts to images and caps size.
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpe?g|png|webp|avif|gif)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only image files (jpg, png, webp, avif, gif) are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB each, up to 8 files
});

export default upload;
