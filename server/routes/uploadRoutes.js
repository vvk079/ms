// routes/uploadRoutes.js
import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import { uploadImages, deleteImage, getUploadAuth } from '../controllers/uploadController.js';

const router = express.Router();
router.use(protect, admin);

router.get('/auth', getUploadAuth);
router.post('/', upload.array('images', 8), uploadImages);
router.delete('/:fileId', deleteImage);

export default router;
