import Product from '../models/productModel.js';

export const generateProductId = async () => {
  try {
    const lastProduct = await Product.findOne().sort({ createdAt: -1 });
    if (!lastProduct) {
      return 'P001';
    }

    const lastId = lastProduct.id;
    const lastNumber = parseInt(lastId.substring(1), 10);
    const newNumber = lastNumber + 1;
    const newId = `P${newNumber.toString().padStart(3, '0')}`;

    return newId;
  } catch (error) {
    throw new Error('Error generating product ID');
  }
};

export const calculateDiscountPercentage = (labeledPrice, currentPrice) => {
  if (!labeledPrice || !currentPrice || labeledPrice <= currentPrice) {
    return 0;
  }
  return Math.round(((labeledPrice - currentPrice) / labeledPrice) * 100);
};

export const autoMarkHotProducts = async () => {
  try {
    // Get products with high sales count (top 20% of products)
    const totalProducts = await Product.countDocuments({ isActive: true });
    const topProductsCount = Math.ceil(totalProducts * 0.2);
    
    const topSellingProducts = await Product.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(topProductsCount)
      .select('id salesCount');

    // Mark top selling products as hot
    const productIds = topSellingProducts.map(product => product.id);
    
    await Product.updateMany(
      { id: { $in: productIds } },
      { isHot: true }
    );

    // Remove hot status from products not in top sellers
    await Product.updateMany(
      { id: { $nin: productIds }, isHot: true },
      { isHot: false }
    );

    return {
      markedAsHot: productIds.length,
      totalProducts,
    };
  } catch (error) {
    throw new Error('Error auto-marking hot products');
  }
};

export const getProductStats = async () => {
  try {
    const stats = await Product.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalSales: { $sum: '$salesCount' },
          avgPrice: { $avg: '$price' },
          avgDiscount: { $avg: '$offerPercentage' },
          hotProducts: {
            $sum: { $cond: ['$isHot', 1, 0] }
          },
          offerProducts: {
            $sum: { $cond: ['$isOffer', 1, 0] }
          }
        }
      }
    ]);

    return stats[0] || {
      totalProducts: 0,
      totalSales: 0,
      avgPrice: 0,
      avgDiscount: 0,
      hotProducts: 0,
      offerProducts: 0,
    };
  } catch (error) {
    throw new Error('Error calculating product stats');
  }
};

export const validateOfferData = (isOffer, offerPercentage, labeledPrice, currentPrice) => {
  const errors = [];

  if (isOffer) {
    if (offerPercentage < 0 || offerPercentage > 100) {
      errors.push('Offer percentage must be between 0 and 100');
    }

    if (labeledPrice && currentPrice) {
      const calculatedDiscount = calculateDiscountPercentage(labeledPrice, currentPrice);
      if (Math.abs(calculatedDiscount - offerPercentage) > 5) {
        errors.push(`Offer percentage (${offerPercentage}%) doesn't match price difference (${calculatedDiscount}%)`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
