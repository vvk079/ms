// routes/userRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  updateProfile, getAddresses, addAddress, updateAddress, deleteAddress,
} from '../controllers/userController.js';

const router = express.Router();
router.use(protect);

router.put('/profile', updateProfile);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addrId', updateAddress);
router.delete('/addresses/:addrId', deleteAddress);

export default router;
