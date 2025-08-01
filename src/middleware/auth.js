import jwt from "jsonwebtoken";

export function verifyJWT(req, res, next) {
    const header = req.header("Authorization");

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = header.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid token." });
        }

        req.user = decoded;
        next();
    });
}

export function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. You must be an administrator.' });
    }
}
