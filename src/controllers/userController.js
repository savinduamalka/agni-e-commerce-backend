import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const generateToken = (user) => {
    const userData = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
    };
    return jwt.sign(
        userData,
        process.env.JWT_KEY,
        { expiresIn: "48h" }
    );
};

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

export async function loginUser(req, res) {
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.password) {
             return res.status(401).json({ message: "Invalid credentials. Please try signing in with Google." });
        }

        const isPasswordCorrect = bcrypt.compareSync(req.body.password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = generateToken(user);
        
        const userData = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
        };

        res.json({
            message: "Login successful",
            token: token,
            user: userData
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export function getCurrentUser(req,res){
    if(req.user == null){
        res.status(403).json({
            message: "Please login to get user details",
        });
        return;
    }
    res.json({
        user : req.user
    })
}

export async function loginWithGoogle(req, res) {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(401).json({ message: "Access token is required" });
    }

    try {
        const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const googleUser = response.data;

        let user = await User.findOne({ email: googleUser.email });

        if (!user) {
            user = new User({
                email: googleUser.email,
                firstName: googleUser.given_name,
                lastName: googleUser.family_name,
                avatar: googleUser.picture,
            });
            await user.save();
        }

        const token = generateToken(user);
        
        const userData = {
             email: user.email,
             firstName: user.firstName,
             lastName: user.lastName,
             role: user.role,
             avatar: user.avatar,
        }

        res.json({
            message: "Login successful",
            token: token,
            user: userData
        });

    } catch (error) {
        console.error("Google login error:", error);
        if (error.response && error.response.status === 401) {
            return res.status(401).json({ message: "Invalid Google access token" });
        }
        res.status(500).json({ message: "Internal server error" });
    }
}
