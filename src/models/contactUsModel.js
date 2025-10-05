import mongoose from 'mongoose';

const contactUsSchema = mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
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
  },
  {
    timestamps: true,
  }
);

// Auto-increment ID handling
contactUsSchema.pre('save', async function (next) {
  if (!this.isNew || typeof this.id === 'number') {
    return next();
  }

  try {
    const lastEntry = await this.constructor
      .findOne()
      .sort({ id: -1 })
      .select('id')
      .lean();

    this.id = lastEntry ? lastEntry.id + 1 : 1;
    next();
  } catch (error) {
    next(error);
  }
});

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

export default ContactUs;
