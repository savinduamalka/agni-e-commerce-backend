import { Router } from 'express';
const router = Router();
import {
  createProduct,
  getActiveProducts,
  getAllProducts,
} from '../controllers/productController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

router.post('/', verifyJWT, isAdmin, createProduct);
router.get('/', getActiveProducts);
router.get('/admin/all', verifyJWT, isAdmin, getAllProducts);

export default router;
