import express from 'express';
import { verifyJWT } from '../middleware/auth.js';
import {
  getWishlist,
  toggleWishlistItem,
  removeWishlistItem,
  clearWishlist,
} from '../controllers/wishlistController.js';

const wishlistRouter = express.Router();

wishlistRouter.get('/', verifyJWT, getWishlist);
wishlistRouter.post('/', verifyJWT, toggleWishlistItem);
wishlistRouter.delete('/', verifyJWT, clearWishlist);
wishlistRouter.delete('/:productId', verifyJWT, removeWishlistItem);

export default wishlistRouter;
