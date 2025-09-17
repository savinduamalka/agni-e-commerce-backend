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
            return res.status(409).json({ message: "This email is already subscribed" });
        }

        const sub = await SubscriptionUser.create({ email: normalizedEmail });

        return res.status(201).json({ message: "Subscribed successfully", data: { email: sub.email } });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({ message: "This email is already subscribed" });
        }
        return res.status(500).json({ message: "Failed to subscribe" });
    }
};

export const listSubscribers = async (_req, res) => {
    try {
        const subscribers = await SubscriptionUser.find({}, { email: 1, createdAt: 1, _id: 0 }).sort({ createdAt: -1 });
        return res.status(200).json({ data: subscribers });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch subscribers" });
    }
};