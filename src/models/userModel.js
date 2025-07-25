import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "customer"
    },
    isBlocked: {
        type: Boolean,
        required: true,
        default: false
    },
    avatar: {
        type: String,
        default: "https://static.thenounproject.com/png/5100711-200.png"
    },
    address: [{
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
    }],
    phone: {
        type: String,
        trim: true,
    },
});

const User = mongoose.model("users", userSchema);

export default User;
