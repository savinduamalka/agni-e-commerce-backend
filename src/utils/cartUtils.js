import Cart from '../models/cartModel.js';
import Product from '../models/productModel.js';

/**
 * Calculate cart totals
 * @param {Array} items - Cart items
 * @returns {Object} - Totals object
 */
export const calculateCartTotals = (items) => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  return {
    totalItems,
    totalPrice: parseFloat(totalPrice.toFixed(2))
  };
};

/**
 * Check if product is available for cart operations
 * @param {string} productId - Product ID
 * @param {number} quantity - Requested quantity
 * @returns {Object} - Validation result
 */
export const validateProductForCart = async (productId, quantity = 1) => {
  try {
    const product = await Product.findOne({ id: productId, isActive: true });
    
    if (!product) {
      return {
        isValid: false,
        error: 'Product not found or inactive',
        product: null
      };
    }

    if (product.stock < quantity) {
      return {
        isValid: false,
        error: `Only ${product.stock} items available in stock`,
        product,
        availableStock: product.stock
      };
    }

    return {
      isValid: true,
      error: null,
      product
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Error validating product',
      product: null
    };
  }
};

/**
 * Get cart statistics for analytics
 * @param {string} userEmail - User email
 * @returns {Object} - Cart statistics
 */
export const getCartStatistics = async (userEmail) => {
  try {
    const cart = await Cart.findOne({ user: userEmail });
    
    if (!cart) {
      return {
        totalItems: 0,
        totalPrice: 0,
        itemCount: 0,
        averageItemPrice: 0,
        mostExpensiveItem: null,
        cheapestItem: null
      };
    }

    const items = cart.items;
    const totalItems = cart.totalItems;
    const totalPrice = cart.totalPrice;
    const itemCount = items.length;

    let averageItemPrice = 0;
    let mostExpensiveItem = null;
    let cheapestItem = null;

    if (itemCount > 0) {
      averageItemPrice = totalPrice / totalItems;
      
      // Find most expensive and cheapest items
      const sortedByPrice = items.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
      mostExpensiveItem = sortedByPrice[0];
      cheapestItem = sortedByPrice[sortedByPrice.length - 1];
    }

    return {
      totalItems,
      totalPrice,
      itemCount,
      averageItemPrice: parseFloat(averageItemPrice.toFixed(2)),
      mostExpensiveItem,
      cheapestItem
    };
  } catch (error) {
    console.error('Error getting cart statistics:', error);
    return {
      totalItems: 0,
      totalPrice: 0,
      itemCount: 0,
      averageItemPrice: 0,
      mostExpensiveItem: null,
      cheapestItem: null
    };
  }
};

/**
 * Clean up inactive products from cart
 * @param {string} userEmail - User email
 * @returns {Object} - Cleanup result
 */
export const cleanupInactiveProducts = async (userEmail) => {
  try {
    const cart = await Cart.findOne({ user: userEmail })
      .populate({
        path: 'items.product',
        select: 'id isActive'
      });

    if (!cart) {
      return {
        success: true,
        removedItems: 0,
        message: 'Cart not found'
      };
    }

    const originalItemCount = cart.items.length;
    const activeItems = cart.items.filter(item => 
      item.product && item.product.isActive
    );

    const removedItems = originalItemCount - activeItems.length;

    if (removedItems > 0) {
      cart.items = activeItems.map(item => ({
        product: item.product._id,
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price,
        addedAt: item.addedAt
      }));
      
      await cart.save();
    }

    return {
      success: true,
      removedItems,
      message: `Removed ${removedItems} inactive products from cart`
    };
  } catch (error) {
    console.error('Error cleaning up inactive products:', error);
    return {
      success: false,
      removedItems: 0,
      message: 'Error cleaning up cart'
    };
  }
};

/**
 * Merge guest cart with user cart
 * @param {string} userEmail - User email
 * @param {Array} guestCartItems - Guest cart items
 * @returns {Object} - Merge result
 */
export const mergeGuestCart = async (userEmail, guestCartItems) => {
  try {
    if (!guestCartItems || guestCartItems.length === 0) {
      return {
        success: true,
        mergedItems: 0,
        message: 'No guest cart items to merge'
      };
    }

    const cart = await Cart.getOrCreateCart(userEmail);
    let mergedItems = 0;

    for (const guestItem of guestCartItems) {
      const validation = await validateProductForCart(guestItem.productId, guestItem.quantity);
      
      if (validation.isValid) {
        await cart.addItem(guestItem.productId, validation.product, guestItem.quantity);
        mergedItems++;
      }
    }

    return {
      success: true,
      mergedItems,
      message: `Merged ${mergedItems} items from guest cart`
    };
  } catch (error) {
    console.error('Error merging guest cart:', error);
    return {
      success: false,
      mergedItems: 0,
      message: 'Error merging guest cart'
    };
  }
};

/**
 * Get cart recommendations based on current items
 * @param {string} userEmail - User email
 * @param {number} limit - Number of recommendations
 * @returns {Array} - Recommended products
 */
export const getCartRecommendations = async (userEmail, limit = 5) => {
  try {
    const cart = await Cart.findOne({ user: userEmail })
      .populate({
        path: 'items.product',
        select: 'category brand'
      });

    if (!cart || cart.items.length === 0) {
      // If cart is empty, return hot products
      return await Product.find({ isActive: true, isHot: true })
        .select('id name price labeledPrice images isOffer offerPercentage')
        .limit(limit)
        .lean();
    }

    // Get categories and brands from cart items
    const categories = [...new Set(cart.items.map(item => item.product.category))];
    const brands = [...new Set(cart.items.map(item => item.product.brand).filter(Boolean))];

    // Find similar products
    const recommendations = await Product.find({
      isActive: true,
      _id: { $nin: cart.items.map(item => item.product._id) }, // Exclude already in cart
      $or: [
        { category: { $in: categories } },
        { brand: { $in: brands } }
      ]
    })
    .select('id name price labeledPrice images isOffer offerPercentage category brand')
    .limit(limit)
    .lean();

    return recommendations;
  } catch (error) {
    console.error('Error getting cart recommendations:', error);
    return [];
  }
};