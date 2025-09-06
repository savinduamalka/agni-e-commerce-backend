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