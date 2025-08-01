import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import OTP from "../models/otpModel.js";

export const sendOTP = async ({ email, subject, message }) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        if (!email) {
            throw new Error("Email is required");
        }

        await OTP.deleteOne({ email });

        const otp = `${Math.floor(100000 + Math.random() * 900000)}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject,
            html: `<p>${message}</p><p style="color:tomato;font-size:25px;letter-spacing:2px;"><b>${otp}</b></p><p>This code <b>expires in 5 minutes</b>.</p>`,
        };

        const saltRounds = 10;
        const hashedOTP = await bcrypt.hash(otp, saltRounds);
        
        await OTP.create({
            email,
            otp: hashedOTP,
        });

        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
};
