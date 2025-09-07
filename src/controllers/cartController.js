import Cart from '../models/cartModel.js';

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