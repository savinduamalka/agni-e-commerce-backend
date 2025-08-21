import { Router } from 'express';
const router = Router();
import {
  createProduct,
  getActiveProducts,
  getAllProducts,
  deleteProduct,
  getHotProducts,
  getOfferProducts,
  updateProductHotStatus,
  updateProductOffer,
  incrementSalesCount,
  getProductAnalytics,
  bulkUpdateHotStatus,
  bulkUpdateOffers,
  getHotProductsByCategory,
  getOffersByCategory,
} from '../controllers/productController.js';
import { verifyJWT, isAdmin } from '../middleware/auth.js';

// Public routes
router.get('/', getActiveProducts);
router.get('/hot', getHotProducts);
router.get('/offers', getOfferProducts);
router.get('/hot/category/:category', getHotProductsByCategory);
router.get('/offers/category/:category', getOffersByCategory);

// Admin routes
router.post('/', verifyJWT, isAdmin, createProduct);
router.get('/admin/all', verifyJWT, isAdmin, getAllProducts);
router.delete('/:id', verifyJWT, isAdmin, deleteProduct);

// Product management routes
router.patch('/:id/hot-status', verifyJWT, isAdmin, updateProductHotStatus);
router.patch('/:id/offer', verifyJWT, isAdmin, updateProductOffer);

// Bulk operations
router.patch('/bulk/hot-status', verifyJWT, isAdmin, bulkUpdateHotStatus);
router.patch('/bulk/offers', verifyJWT, isAdmin, bulkUpdateOffers);

export default router;
