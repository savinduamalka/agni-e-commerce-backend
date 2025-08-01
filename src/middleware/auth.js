import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export async function verifyJWT(req, res, next) {
    const header = req.header("Authorization");

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = header.replace("Bearer ", "");

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(401).json({ message: "Invalid token. User not found." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: "Access denied. Your account has been blocked." });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token." });
    }
}

export function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. You must be an administrator.' });
    }
}
