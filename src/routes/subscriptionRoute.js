import express from "express";
import { subscribe, listSubscribers} from "../controllers/subscriptionController.js";
import { verifyJWT, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Public endpoint for users to subscribe by email
router.post("/subscribe", subscribe);

// Admin-only endpoints
router.get("/", verifyJWT, isAdmin, listSubscribers);

export default router;


