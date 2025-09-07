import express from 'express';
import {getCart} from '../controllers/cartController.js';
import { verifyJWT } from '../middleware/auth.js';

const cartRouter = express.Router();

// All cart routes require authentication
cartRouter.use(verifyJWT);

// Cart routes
cartRouter.get('/', getCart);

export default cartRouter;
