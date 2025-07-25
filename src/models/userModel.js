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
        required: false,
        default: "https://static.thenounproject.com/png/5100711-200.png"
    },
    address: [{
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        required: false
    }],
    phone: {
        type: String,
        trim: true,
        required: false
    },
});

const User = mongoose.model("users", userSchema);

export default User;
