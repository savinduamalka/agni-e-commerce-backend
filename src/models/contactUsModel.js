import mongoose from "mongoose";

const contactUsSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
    },
    name: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

// Add auto-increment ID
contactUsSchema.plugin(require('mongoose-auto-increment').plugin, {
    model: 'ContactUs',
    field: 'id',
    startAt: 1,
    incrementBy: 1
});

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

export default ContactUs;