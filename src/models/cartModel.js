import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: String, // Using email as the primary key as per project convention
      required: true,
      unique: true,
      trim: true,
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ lastUpdated: -1 });

// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
  this.totalItems = this.items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  this.lastUpdated = new Date();
  next();
});

// Method to add item to cart
cartSchema.methods.addItem = function (productId, product, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    (item) => item.productId === productId
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].price = product.price; // Update price in case it changed
  } else {
    // Add new item
    this.items.push({
      product: product._id,
      productId: product.id,
      quantity,
      price: product.price,
    });
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (productId, quantity) {
  const item = this.items.find((item) => item.productId === productId);

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    this.items = this.items.filter((item) => item.productId !== productId);
  } else {
    item.quantity = quantity;
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function (productId) {
  this.items = this.items.filter((item) => item.productId !== productId);
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  return this.save();
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function (userEmail) {
  let cart = await this.findOne({ user: userEmail });

  if (!cart) {
    cart = new this({ user: userEmail });
    await cart.save();
  }

  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
