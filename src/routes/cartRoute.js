import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem
} from '../controllers/cartController.js';
import { verifyJWT } from '../middleware/auth.js';

const cartRouter = express.Router();

// All cart routes require authentication
cartRouter.use(verifyJWT);

// Cart routes
cartRouter.get('/', getCart);                    
cartRouter.post('/add', addToCart);            
cartRouter.put('/item/:productId', updateCartItem); 

export default cartRouter;
