import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export function createUser(req, res) {

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
        res.status(500).json({
            message: "User creation failed",
            error: err
        })
    })
}

export function loginUser(req, res) {
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
                    const token = jwt.sign(
                        {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            avatar: user.avatar,
                        },
                        process.env.JWT_KEY
                    )
                    res.json({
                        message: "Login successful",
                        token: token,
                        role: user.role
                    })

                } else {
                    res.status(401).json({
                        message: "Invalid password"
                    })
                }
            }
        }
    )}