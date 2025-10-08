import Wishlist from '../models/wishlistModel.js';
import Product from '../models/productModel.js';

const PRODUCT_PROJECTION =
  'id name price labeledPrice images isActive isOffer offerPercentage stock brand averageRating totalReviews';

const formatResponse = (wishlistDoc, populatedItems) => ({
  user: wishlistDoc.user,
  items: populatedItems,
  totalItems: populatedItems.length,
  lastUpdated: wishlistDoc.lastUpdated,
  createdAt: wishlistDoc.createdAt,
  updatedAt: wishlistDoc.updatedAt,
});

const populateWishlist = (wishlistId) =>
  Wishlist.findById(wishlistId)
    .populate({
      path: 'items.product',
      select: PRODUCT_PROJECTION,
    })
    .lean();

export const getWishlist = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const wishlist = await Wishlist.getOrCreateWishlist(userEmail);

    const populatedWishlist = await populateWishlist(wishlist._id);

    const activeItems = populatedWishlist.items.filter(
      (item) => item.product && item.product.isActive
    );

    if (activeItems.length !== populatedWishlist.items.length) {
      wishlist.items = activeItems.map((item) => ({
        product: item.product._id,
        productId: item.product.id,
        addedAt: item.addedAt,
      }));
      await wishlist.save();
    }

    res.status(200).json({
      message: 'Wishlist retrieved successfully',
      wishlist: formatResponse(wishlist, activeItems),
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      message: 'Error retrieving wishlist',
      error: error.message,
    });
  }
};

export const toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.body;
    const userEmail = req.user.email;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findOne({ id: productId, isActive: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    const wishlist = await Wishlist.getOrCreateWishlist(userEmail);

    let action;
    if (wishlist.hasItem(productId)) {
      await wishlist.removeItem(productId);
      action = 'removed';
    } else {
      await wishlist.addItem(product);
      action = 'added';
    }

    const populatedWishlist = await populateWishlist(wishlist._id);
    const activeItems = populatedWishlist.items.filter(
      (item) => item.product && item.product.isActive
    );

    res.status(200).json({
      message:
        action === 'added'
          ? 'Product added to wishlist successfully'
          : 'Product removed from wishlist successfully',
      action,
      wishlist: formatResponse(wishlist, activeItems),
    });
  } catch (error) {
    console.error('Toggle wishlist item error:', error);
    res.status(500).json({
      message: 'Error updating wishlist',
      error: error.message,
    });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userEmail = req.user.email;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const wishlist = await Wishlist.getOrCreateWishlist(userEmail);

    if (!wishlist.hasItem(productId)) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    await wishlist.removeItem(productId);

    const populatedWishlist = await populateWishlist(wishlist._id);
    const activeItems = populatedWishlist.items.filter(
      (item) => item.product && item.product.isActive
    );

    res.status(200).json({
      message: 'Product removed from wishlist successfully',
      wishlist: formatResponse(wishlist, activeItems),
    });
  } catch (error) {
    console.error('Remove wishlist item error:', error);
    res.status(500).json({
      message: 'Error removing item from wishlist',
      error: error.message,
    });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const wishlist = await Wishlist.getOrCreateWishlist(userEmail);

    if (!wishlist.items.length) {
      return res.status(200).json({
        message: 'Wishlist is already empty',
        wishlist: formatResponse(wishlist, []),
      });
    }

    await wishlist.clearItems();

    res.status(200).json({
      message: 'Wishlist cleared successfully',
      wishlist: formatResponse(wishlist, []),
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      message: 'Error clearing wishlist',
      error: error.message,
    });
  }
};
