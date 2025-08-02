import express from 'express';
import { createCategory } from '../controllers/categoryController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyJWT, isAdmin, createCategory);

export default router;