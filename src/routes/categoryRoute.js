import express from 'express';
import {
  createCategory,
  getActiveCategories,
  getAllCategories,
  updateCategory,
} from '../controllers/categoryController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getActiveCategories);

// Admin only routes
router.get('/all', verifyJWT, isAdmin, getAllCategories);
router.post('/', verifyJWT, isAdmin, createCategory);
router.put('/:id', verifyJWT, isAdmin, updateCategory);

export default router;
