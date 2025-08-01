import express from "express";
import { createUser, getCurrentUser, loginUser, loginWithGoogle, sendOTP } from "../controllers/userController.js";
import { verifyJWT, isAdmin } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/send-otp", sendOTP);


userRouter.get("/me", verifyJWT, getCurrentUser);

userRouter.get("/admin-only", verifyJWT, isAdmin, (req, res) => {
    res.json({ message: "Welcome, admin!" });
});

export default userRouter;
