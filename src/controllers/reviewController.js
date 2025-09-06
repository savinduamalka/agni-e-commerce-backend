import Review from '../models/reviewModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';
import { calculateProductRating, validateReviewData, canUserReviewProduct } from '../utils/reviewUtils.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userEmail = req.user.email; // From JWT token
    
    // Get user by email to get their MongoDB _id
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const userId = user._id;

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
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if user has already reviewed this product
    const canReview = await canUserReviewProduct(userId, product._id);
    if (!canReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
      });
    }

    // Create the review
    const review = new Review({
      user: userId,
      product: product._id, // Use MongoDB _id instead of custom id
      rating,
      comment,
    });

    await review.save();

    // Update product with review reference and recalculate average rating
    product.reviews.push(review._id);
    
    // Recalculate average rating and total reviews
    const ratingData = await calculateProductRating(product._id);
    
    // Update product with new rating data
    product.averageRating = ratingData.averageRating;
    product.totalReviews = ratingData.totalReviews;
    await product.save();

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
    const product = await Product.findOne({ id: productId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const skip = (page - 1) * limit;

    // Get reviews with pagination and sorting
    const reviews = await Review.find({
      product: product._id, // Use MongoDB _id instead of custom id
      isActive: true,
    })
      .populate('user', 'firstName lastName avatar')
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const totalReviews = await Review.countDocuments({
      product: product._id, // Use MongoDB _id instead of custom id
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

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userEmail = req.user.email;
    
    // Get user by email to get their MongoDB _id
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const userId = user._id;

    // Validate input
    if (!rating && !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating or comment is required for update',
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews',
      });
    }

    // Update the review
    const updateData = {};
    if (rating) updateData.rating = rating;
    if (comment) updateData.comment = comment;

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    ).populate('user', 'firstName lastName avatar');

    // Recalculate product rating and update product
    const ratingData = await calculateProductRating(review.product);
    await Product.findByIdAndUpdate(review.product, {
      averageRating: ratingData.averageRating,
      totalReviews: ratingData.totalReviews,
    });

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userEmail = req.user.email;
    
    // Get user by email to get their MongoDB _id
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const userId = user._id;

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check if user owns the review
    if (review.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews',
      });
    }

    // Soft delete the review
    await Review.findByIdAndUpdate(reviewId, { isActive: false });

    // Remove review from product
    await Product.findByIdAndUpdate(review.product, {
      $pull: { reviews: reviewId },
    });

    // Recalculate product rating and update product
    const ratingData = await calculateProductRating(review.product);
    await Product.findByIdAndUpdate(review.product, {
      averageRating: ratingData.averageRating,
      totalReviews: ratingData.totalReviews,
    });

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { page = 1, limit = 10 } = req.query;
    
    // Get user by email to get their MongoDB _id
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const userId = user._id;

    const skip = (page - 1) * limit;

    const reviews = await Review.find({
      user: userId,
      isActive: true,
    })
      .populate('product', 'id name images price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalReviews = await Review.countDocuments({
      user: userId,
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
      },
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};


