import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { verifyJWT } from '../middleware/auth.js';

const cartRouter = express.Router();

// All cart routes require authentication
cartRouter.use(verifyJWT);

// Cart routes
cartRouter.get('/', getCart);                    // Get user's cart
cartRouter.post('/add', addToCart);              // Add item to cart
cartRouter.put('/item/:productId', updateCartItem); // Update item quantity
cartRouter.delete('/item/:productId', removeFromCart); // Remove item from cart
cartRouter.delete('/clear', clearCart);          // Clear entire cart

export default cartRouter;
