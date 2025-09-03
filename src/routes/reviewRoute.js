import { Router } from 'express';
const router = Router();
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews,
} from '../controllers/reviewController.js';
import { verifyJWT } from '../middleware/auth.js';

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.post('/', verifyJWT, createReview);
router.get('/user', verifyJWT, getUserReviews);
router.put('/:reviewId', verifyJWT, updateReview);
router.delete('/:reviewId', verifyJWT, deleteReview);

export default router;




