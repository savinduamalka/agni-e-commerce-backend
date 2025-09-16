import SubscriptionUser from "../models/subcriptionUsersModel.js";

export const subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || typeof email !== "string") {
            return res.status(400).json({ message: "Valid email is required" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existing = await SubscriptionUser.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(200).json({ message: "Already subscribed" });
        }

        const sub = await SubscriptionUser.create({ email: normalizedEmail });

        return res.status(201).json({ message: "Subscribed successfully", data: { email: sub.email } });
    } catch (error) {
        return res.status(500).json({ message: "Failed to subscribe" });
    }
};