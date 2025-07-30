import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function createUser(req, res) {

    console.log("Request body:", req.body);

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user = new User({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: hashedPassword,
        avatar: req.body.avatar,
    })

    user.save().then((user) => {
        res.status(201).json({
            message: "User created successfully",
            user: user
        })
    }).catch((err) => {
        console.error("User creation error:", err);
        res.status(500).json({
            message: "User creation failed",
            error: err
        })
    })
}

export function loginUser(req, res) {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    const email = req.body.email
    const password = req.body.password

    User.findOne({ email: email }).then(
        (user) => {
            if (user == null) {
                res.status(404).json({
                    message: "User not found"
                })
            } else {
                const isPasswordCorrect = bcrypt.compareSync(password, user.password)
                if (isPasswordCorrect) {
                    const userData = {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        avatar: user.avatar,
                    };
                    const token = jwt.sign(
                        userData,
                        process.env.JWT_KEY,
                        { expiresIn: "48h" }
                    );
                    res.json({
                        message: "Login successful",
                        token: token,
                        user: userData
                    });

                } else {
                    res.status(401).json({
                        message: "Invalid password"
                    })
                }
            }
        }
    )}