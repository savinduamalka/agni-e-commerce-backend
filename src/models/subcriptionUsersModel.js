import mongoose from "mongoose";

const subscriptionUserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
}, {
    timestamps: true,
});

const SubscriptionUser = mongoose.model("subscription_users", subscriptionUserSchema);

export default SubscriptionUser;


