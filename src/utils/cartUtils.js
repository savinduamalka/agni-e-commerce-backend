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