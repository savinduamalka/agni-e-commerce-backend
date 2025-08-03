import express from 'express';
import {
  createCategory,
  getActiveCategories,
} from '../controllers/categoryController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getActiveCategories);

// Admin only routes
router.post('/', verifyJWT, isAdmin, createCategory);

export default router;
