import Review from '../models/reviewModel.js';
import Product from '../models/productModel.js';

// Calculate and update product rating
export const calculateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({
      product: productId,
      isActive: true,
    });

    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        totalReviews: 0,
      });
      return { averageRating: 0, totalReviews: 0 };
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place

    await Product.findByIdAndUpdate(productId, {
      averageRating: roundedRating,
      totalReviews: reviews.length,
    });

    return { averageRating: roundedRating, totalReviews: reviews.length };
  } catch (error) {
    console.error('Error calculating product rating:', error);
    throw error;
  }
};

// Validate review data
export const validateReviewData = (rating, comment) => {
  const errors = [];

  if (!rating || rating < 1 || rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (!comment || comment.trim().length === 0) {
    errors.push('Comment is required');
  } else if (comment.trim().length > 500) {
    errors.push('Comment must be less than 500 characters');
  }

  return errors;
};
