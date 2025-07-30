import express from "express";
import { createUser, getCurrentUser, loginUser } from "../controllers/userController.js";
import verifyJWT from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/", createUser);
userRouter.post("/login", loginUser);


userRouter.get("/me", verifyJWT, getCurrentUser);

export default userRouter;
