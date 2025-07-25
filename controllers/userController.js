import bcrypt from "bcrypt";
import User from "../models/userModel.js";

export function createUser(req, res){

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