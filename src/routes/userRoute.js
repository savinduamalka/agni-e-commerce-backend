import express from "express";
import { 
    createUser, 
    getCurrentUser, 
    loginUser, 
    loginWithGoogle, 
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    requestEmailVerification
} from "../controllers/userController.js";
import { verifyJWT, isAdmin } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/request-password-reset", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/request-email-verification", requestEmailVerification);


userRouter.get("/me", verifyJWT, getCurrentUser);

userRouter.get("/admin-only", verifyJWT, isAdmin, (req, res) => {
    res.json({ message: "Welcome, admin!" });
});

export default userRouter;
