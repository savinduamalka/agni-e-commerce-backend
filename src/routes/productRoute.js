import { Router } from 'express';
const router = Router();
import {
  createProduct,
  getActiveProducts,
  getAllProducts,
  deleteProduct,
} from '../controllers/productController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

router.post('/', verifyJWT, isAdmin, createProduct);
router.get('/', getActiveProducts);
router.get('/admin/all', verifyJWT, isAdmin, getAllProducts);
router.delete('/:id', verifyJWT, isAdmin, deleteProduct);

export default router;
