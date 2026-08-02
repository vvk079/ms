// routes/reviewRoutes.js
import express from 'express';
import { body } from 'express-validator';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/authMiddleware.js';
import { getProductReviews, createReview, deleteReview } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/:productId', getProductReviews);
router.post(
  '/:productId',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
    body('comment').trim().notEmpty().withMessage('Please write a comment'),
  ],
  validate,
  createReview
);
router.delete('/:id', protect, deleteReview);

export default router;
