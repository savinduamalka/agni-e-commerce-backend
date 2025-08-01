import express from "express";
import { 
    createUser, 
    getCurrentUser, 
    loginUser, 
    loginWithGoogle, 
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    requestEmailVerification,
    updateUser,
    changePassword,
    deleteUser,
    blockUser,
    unblockUser,
    getAllUsers
} from "../controllers/userController.js";
import { verifyJWT, isAdmin } from "../middleware/auth.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/request-password-reset", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/request-email-verification", requestEmailVerification);

// User routes
userRouter.get("/me", verifyJWT, getCurrentUser);
userRouter.put("/me", verifyJWT, updateUser);
userRouter.delete("/me", verifyJWT, deleteUser);
userRouter.put("/change-password", verifyJWT, changePassword);

// Admin routes
userRouter.put("/block/:email", verifyJWT, isAdmin, blockUser);
userRouter.put("/unblock/:email", verifyJWT, isAdmin, unblockUser);
userRouter.get("/all", verifyJWT, isAdmin, getAllUsers);
userRouter.get("/admin-only", verifyJWT, isAdmin, (req, res) => {
    res.json({ message: "Welcome, admin!" });
});

export default userRouter;
