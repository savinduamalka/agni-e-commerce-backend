import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import axios from "axios";


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

export async function createUser(req, res) {
    const { email, firstName, lastName, password, avatar } = req.body;

    if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({
            message: "All fields are required",
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: "User already exists",
            });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const user = new User({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            avatar,
        });

        const savedUser = await user.save();
        
        const token = generateToken(savedUser);

        res.status(201).json({
            message: "User created successfully",
            token: token,
            user: {
                email: savedUser.email,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                role: savedUser.role,
                avatar: savedUser.avatar,
            }
        });
    } catch (err) {
        console.error("User creation error:", err);
        res.status(500).json({
            message: "User creation failed",
        });
    }
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

