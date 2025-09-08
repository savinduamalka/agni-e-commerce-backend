import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    const cart = await Cart.getOrCreateCart(userEmail);
    
    // Populate product details for each item
    const populatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'id name price labeledPrice images isActive isOffer offerPercentage stock'
      })
      .lean();

    // Filter out inactive products and update cart if needed
    const activeItems = populatedCart.items.filter(item => 
      item.product && item.product.isActive
    );

    // If some items were filtered out, update the cart
    if (activeItems.length !== populatedCart.items.length) {
      cart.items = activeItems.map(item => ({
        product: item.product._id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        addedAt: item.addedAt
      }));
      await cart.save();
    }

    res.status(200).json({
      message: 'Cart retrieved successfully',
      cart: {
        user: cart.user,
        items: activeItems,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        lastUpdated: cart.lastUpdated,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      message: 'Error retrieving cart', 
      error: error.message 
    });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userEmail = req.user.email;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Find the product
    const product = await Product.findOne({ id: productId, isActive: true });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Check stock availability
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    // Get or create cart for user
    const cart = await Cart.getOrCreateCart(userEmail);

    // Add item to cart
    await cart.addItem(productId, product, quantity);

    // Populate the updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'id name price labeledPrice images isActive isOffer offerPercentage stock'
      });

    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: {
        user: cart.user,
        items: updatedCart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      message: 'Error adding item to cart', 
      error: error.message 
    });
  }
};

// Update item quantity in cart
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userEmail = req.user.email;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userEmail });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if product exists and is active
    const product = await Product.findOne({ id: productId, isActive: true });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Check stock availability if quantity > 0
    if (quantity > 0 && product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    // Update item quantity
    await cart.updateItemQuantity(productId, quantity);

    // Populate the updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'id name price labeledPrice images isActive isOffer offerPercentage stock'
      });

    res.status(200).json({
      message: 'Cart item updated successfully',
      cart: {
        user: cart.user,
        items: updatedCart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ 
      message: 'Error updating cart item', 
      error: error.message 
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userEmail = req.user.email;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userEmail });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Remove item from cart
    await cart.removeItem(productId);

    // Populate the updated cart
    const updatedCart = await Cart.findById(cart._id)
      .populate({
        path: 'items.product',
        select: 'id name price labeledPrice images isActive isOffer offerPercentage stock'
      });

    res.status(200).json({
      message: 'Item removed from cart successfully',
      cart: {
        user: cart.user,
        items: updatedCart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      message: 'Error removing item from cart', 
      error: error.message 
    });
  }
};

// Clear entire cart
export const clearCart = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Get user's cart
    const cart = await Cart.findOne({ user: userEmail });
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Clear cart
    await cart.clearCart();

    res.status(200).json({
      message: 'Cart cleared successfully',
      cart: {
        user: cart.user,
        items: [],
        totalItems: 0,
        totalPrice: 0,
        lastUpdated: cart.lastUpdated
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      message: 'Error clearing cart', 
      error: error.message 
    });
  }
};