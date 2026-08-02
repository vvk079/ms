// routes/wishlistRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getWishlist, toggleWishlist, removeWishlist } from '../controllers/wishlistController.js';

const router = express.Router();
router.use(protect);

router.get('/', getWishlist);
router.post('/:productId', toggleWishlist);
router.delete('/:productId', removeWishlist);

export default router;
