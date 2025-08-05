import { Router } from 'express';
const router = Router();
import { createProduct } from '../controllers/productController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

router.post('/', verifyJWT, isAdmin, createProduct);

export default router;
