import Review from '../models/reviewModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { calculateProductRating, validateReviewData, canUserReviewProduct } from '../utils/reviewUtils.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id; // From JWT token

    // Validate input
    const validationErrors = validateReviewData(rating, comment);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user has already reviewed this product
    const canReview = await canUserReviewProduct(userId, productId);
    if (!canReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Create the review
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await review.save();

    // Update product with review reference and recalculate average rating
    product.reviews.push(review._id);
    await product.save();

    // Recalculate average rating and total reviews
    await calculateProductRating(productId);

    // Populate user info for response
    await review.populate('user', 'firstName lastName avatar');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get reviews for a product
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const skip = (page - 1) * limit;

    // Get reviews with pagination and sorting
    const reviews = await Review.find({
      product: productId,
      isActive: true,
    })
      .populate('user', 'firstName lastName avatar')
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalReviews = await Review.countDocuments({
      product: productId,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / limit),
          totalReviews,
          hasNext: skip + reviews.length < totalReviews,
          hasPrev: page > 1,
        },
        productRating: {
          averageRating: product.averageRating,
          totalReviews: product.totalReviews,
        },
      },
    });
  } catch (error) {
    console.error('Error getting product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
