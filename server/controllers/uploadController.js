// controllers/uploadController.js
// Receives multipart image files (via multer memory storage) and pushes them to
// ImageKit, returning CDN URLs + fileIds for the admin product/category forms.
import asyncHandler from '../middleware/asyncHandler.js';
import { uploadToImageKit, deleteFromImageKit } from '../config/imagekit.js';

// @route  POST /api/upload   (admin)  field name: "images" (up to 8)
export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) {
    res.status(400);
    throw new Error('No files uploaded');
  }
  const folder = req.query.folder || '/richbayy/products';
  const results = await Promise.all(
    req.files.map((f) => uploadToImageKit(f.buffer, f.originalname, folder))
  );
  res.status(201).json({ images: results });
});

// @route  DELETE /api/upload/:fileId   (admin)
export const deleteImage = asyncHandler(async (req, res) => {
  await deleteFromImageKit(req.params.fileId);
  res.json({ message: 'Image deleted' });
});

// @route  GET /api/upload/auth   (admin)
// Returns ImageKit client-side auth params if you ever want direct browser uploads.
import { getImageKitAuth } from '../config/imagekit.js';
export const getUploadAuth = asyncHandler(async (req, res) => {
  res.json(getImageKitAuth());
});
