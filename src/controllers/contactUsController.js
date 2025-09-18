import ContactUs from "../models/contactUsModel.js";
import { sendContactEmail } from "../utils/emailUtils.js";
import validator from "validator";

export const submitInquiry = async (req, res) => {
    try {
        const { name, email, contactNumber, message } = req.body;

        // Validation
        if (!name || !email || !contactNumber || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Email validation
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // Name validation (should not be empty and should contain only letters and spaces)
        if (!validator.isLength(name, { min: 2, max: 50 }) || !validator.isAlpha(name.replace(/\s/g, ''))) {
            return res.status(400).json({
                success: false,
                message: "Name should be between 2-50 characters and contain only letters"
            });
        }

        // Contact number validation (basic phone number validation)
        if (!validator.isMobilePhone(contactNumber)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid contact number"
            });
        }

        // Message validation
        if (!validator.isLength(message, { min: 10, max: 1000 })) {
            return res.status(400).json({
                success: false,
                message: "Message should be between 10-1000 characters"
            });
        }

        // Create contact inquiry in database
        const contactInquiry = await ContactUs.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            contactNumber: contactNumber.trim(),
            message: message.trim()
        });

        // Send email to admin
        await sendContactEmail({
            name: contactInquiry.name,
            email: contactInquiry.email,
            contactNumber: contactInquiry.contactNumber,
            message: contactInquiry.message
        });

        res.status(201).json({
            success: true,
            message: "Your inquiry has been submitted successfully. We will get back to you soon!",
            data: {
                id: contactInquiry.id,
                name: contactInquiry.name,
                email: contactInquiry.email,
                submittedAt: contactInquiry.createdAt
            }
        });

    } catch (error) {
        console.error("Error submitting inquiry:", error);
        
        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error: " + Object.values(error.errors).map(err => err.message).join(', ')
            });
        }

        if (error.message.includes('email')) {
            return res.status(500).json({
                success: false,
                message: "Failed to send email notification. Please try again later."
            });
        }

        res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later."
        });
    }
};