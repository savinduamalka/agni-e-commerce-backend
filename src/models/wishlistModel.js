import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productId: {
    type: String,
    required: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Storing the user's email for quick lookup as per project conventions
      required: true,
      unique: true,
      trim: true,
    },
    items: [wishlistItemSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ 'items.product': 1 });
wishlistSchema.index({ lastUpdated: -1 });

wishlistSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

wishlistSchema.methods.addItem = function (product) {
  const exists = this.items.some((item) => item.productId === product.id);

  if (!exists) {
    this.items.push({
      product: product._id,
      productId: product.id,
    });
  }

  return this.save();
};

wishlistSchema.methods.removeItem = function (productId) {
  const initialLength = this.items.length;
  this.items = this.items.filter((item) => item.productId !== productId);

  if (this.items.length === initialLength) {
    return this;
  }

  return this.save();
};

wishlistSchema.methods.hasItem = function (productId) {
  return this.items.some((item) => item.productId === productId);
};

wishlistSchema.methods.clearItems = function () {
  if (this.items.length === 0) {
    return this;
  }
  this.items = [];
  return this.save();
};

wishlistSchema.statics.getOrCreateWishlist = async function (userEmail) {
  let wishlist = await this.findOne({ user: userEmail });

  if (!wishlist) {
    wishlist = new this({ user: userEmail });
    await wishlist.save();
  }

  return wishlist;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

export default Wishlist;
