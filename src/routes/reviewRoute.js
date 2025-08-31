import { Router } from 'express';
const router = Router();
import {
  createReview,
  getProductReviews,
} from '../controllers/reviewController.js';
import { verifyJWT } from '../middleware/auth.js';

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.post('/', verifyJWT, createReview);


export default router;

