import { Router } from 'express';
const router = Router();
import { createProduct, getActiveProducts } from '../controllers/productController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

router.post('/', verifyJWT, isAdmin, createProduct);
router.get('/', getActiveProducts);

export default router;
