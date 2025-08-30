import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import { generateProductId } from '../utils/productUtils.js';

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      labeledPrice,
      quantity,
      category,
      brand,
      images,
      altNames,
      specifications,
      features,
      isActive,
      isHot,
      isOffer,
      offerPercentage,
    } = req.body;

    if (
      !name ||
      !description ||
      !price ||
      !labeledPrice ||
      !quantity ||
      !category
    ) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const categoryExists = await Category.findOne({ id: category });
    if (!categoryExists) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const id = await generateProductId();

    const newProduct = new Product({
      id,
      name,
      description,
      price,
      labeledPrice,
      stock: quantity,
      category: categoryExists._id,
      categoryId: categoryExists.id,
      brand,
      images,
      altNames,
      specifications,
      features,
      isActive,
      isHot: isHot || false,
      isOffer: isOffer || false,
      offerPercentage: offerPercentage || 0,
    });

    await newProduct.save();

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error creating product', error: error.message });
  }
};

export const getActiveProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      brand,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      const categoryDoc = await Category.findOne({ id: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return res.status(200).json({
          products: [],
          totalPages: 0,
          currentPage: parseInt(page),
          totalProducts: 0,
        });
      }
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name id')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products,
      totalPages,
      currentPage: parseInt(page),
      totalProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({
      message: 'Error fetching active products',
      error: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      isActive,
    } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category) {
      const categoryDoc = await Category.findOne({ id: category });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return res.status(200).json({
          products: [],
          totalPages: 0,
          currentPage: parseInt(page),
          totalProducts: 0,
        });
      }
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name id')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });

    res.status(200).json({
      products,
      totalPages,
      currentPage: parseInt(page),
      totalProducts,
      statistics: {
        activeProducts,
        inactiveProducts,
        totalProducts: activeProducts + inactiveProducts,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error fetching all products', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findOneAndDelete({ id });

    res.status(200).json({
      message: 'Product deleted successfully',
      deletedProduct: {
        id: product.id,
        name: product.name,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error deleting product', error: error.message });
  }
};

export const getHotProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'salesCount',
      sortOrder = 'desc',
    } = req.query;

    const query = { 
      isActive: true,
      isHot: true 
    };

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name id')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products,
      totalPages,
      currentPage: parseInt(page),
      totalProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Error fetching hot products',
        error: error.message,
      });
  }
};

export const getOfferProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'offerPercentage',
      sortOrder = 'desc',
      minDiscount,
      maxDiscount,
    } = req.query;

    const query = { 
      isActive: true,
      isOffer: true 
    };

    // Filter by discount percentage range
    if (minDiscount || maxDiscount) {
      query.offerPercentage = {};
      if (minDiscount) {
        query.offerPercentage.$gte = parseFloat(minDiscount);
      }
      if (maxDiscount) {
        query.offerPercentage.$lte = parseFloat(maxDiscount);
      }
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name id')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products,
      totalPages,
      currentPage: parseInt(page),
      totalProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Error fetching offer products',
        error: error.message,
      });
  }
};

export const updateProductHotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isHot } = req.body;

    if (typeof isHot !== 'boolean') {
      return res.status(400).json({ message: 'isHot must be a boolean value' });
    }

    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isHot = isHot;
    await product.save();

    res.status(200).json({
      message: `Product ${isHot ? 'marked as hot' : 'removed from hot products'}`,
      product: {
        id: product.id,
        name: product.name,
        isHot: product.isHot,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error updating product hot status', 
        error: error.message 
      });
  }
};

export const updateProductOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOffer, offerPercentage } = req.body;

    if (typeof isOffer !== 'boolean') {
      return res.status(400).json({ message: 'isOffer must be a boolean value' });
    }

    if (isOffer && (offerPercentage < 0 || offerPercentage > 100)) {
      return res.status(400).json({ 
        message: 'Offer percentage must be between 0 and 100' 
      });
    }

    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isOffer = isOffer;
    product.offerPercentage = isOffer ? (offerPercentage || 0) : 0;
    await product.save();

    res.status(200).json({
      message: `Product ${isOffer ? 'marked as offer' : 'removed from offers'}`,
      product: {
        id: product.id,
        name: product.name,
        isOffer: product.isOffer,
        offerPercentage: product.offerPercentage,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error updating product offer', 
        error: error.message 
      });
  }
};

export const incrementSalesCount = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.body;

    const product = await Product.findOne({ id });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.salesCount += parseInt(quantity);
    await product.save();

    res.status(200).json({
      message: 'Sales count updated successfully',
      product: {
        id: product.id,
        name: product.name,
        salesCount: product.salesCount,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error updating sales count', 
        error: error.message 
      });
  }
};

export const getProductAnalytics = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const hotProducts = await Product.countDocuments({ isActive: true, isHot: true });
    const offerProducts = await Product.countDocuments({ isActive: true, isOffer: true });
    
    // Get top selling products
    const topSellingProducts = await Product.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(10)
      .select('id name salesCount price');

    // Get products with highest discounts
    const highestDiscountProducts = await Product.find({ 
      isActive: true, 
      isOffer: true 
    })
      .sort({ offerPercentage: -1 })
      .limit(10)
      .select('id name offerPercentage price labeledPrice');

    res.status(200).json({
      analytics: {
        totalProducts,
        hotProducts,
        offerProducts,
        hotProductsPercentage: totalProducts > 0 ? (hotProducts / totalProducts * 100).toFixed(2) : 0,
        offerProductsPercentage: totalProducts > 0 ? (offerProducts / totalProducts * 100).toFixed(2) : 0,
      },
      topSellingProducts,
      highestDiscountProducts,
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error fetching product analytics', 
        error: error.message 
      });
  }
};

export const getHotProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'salesCount',
      sortOrder = 'desc',
    } = req.query;

    const categoryDoc = await Category.findOne({ id: category });
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const query = { 
      isActive: true,
      isHot: true,
      category: categoryDoc._id
    };

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name id')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products,
      totalPages,
      currentPage: parseInt(page),
      totalProducts,
      category: {
        id: categoryDoc.id,
        name: categoryDoc.name,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Error fetching hot products by category',
        error: error.message,
      });
  }
};

export const getOffersByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'offerPercentage',
      sortOrder = 'desc',
      minDiscount,
      maxDiscount,
    } = req.query;

    const categoryDoc = await Category.findOne({ id: category });
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const query = { 
      isActive: true,
      isOffer: true,
      category: categoryDoc._id
    };

    // Filter by discount percentage range
    if (minDiscount || maxDiscount) {
      query.offerPercentage = {};
      if (minDiscount) {
        query.offerPercentage.$gte = parseFloat(minDiscount);
      }
      if (maxDiscount) {
        query.offerPercentage.$lte = parseFloat(maxDiscount);
      }
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name id')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      products,
      totalPages,
      currentPage: parseInt(page),
      totalProducts,
      category: {
        id: categoryDoc.id,
        name: categoryDoc.name,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: 'Error fetching offer products by category',
        error: error.message,
      });
  }
};

export const bulkUpdateHotStatus = async (req, res) => {
  try {
    const { productIds, isHot } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    if (typeof isHot !== 'boolean') {
      return res.status(400).json({ message: 'isHot must be a boolean value' });
    }

    const result = await Product.updateMany(
      { id: { $in: productIds } },
      { isHot }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No products found with the provided IDs' });
    }

    res.status(200).json({
      message: `Successfully ${isHot ? 'marked' : 'unmarked'} ${result.modifiedCount} products as hot`,
      updatedCount: result.modifiedCount,
      totalRequested: productIds.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error updating bulk hot status', 
        error: error.message 
      });
  }
};

export const bulkUpdateOffers = async (req, res) => {
  try {
    const { productIds, isOffer, offerPercentage } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ message: 'Product IDs array is required' });
    }

    if (typeof isOffer !== 'boolean') {
      return res.status(400).json({ message: 'isOffer must be a boolean value' });
    }

    if (isOffer && (offerPercentage < 0 || offerPercentage > 100)) {
      return res.status(400).json({ 
        message: 'Offer percentage must be between 0 and 100' 
      });
    }

    const updateData = {
      isOffer,
      offerPercentage: isOffer ? (offerPercentage || 0) : 0
    };

    const result = await Product.updateMany(
      { id: { $in: productIds } },
      updateData
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'No products found with the provided IDs' });
    }

    res.status(200).json({
      message: `Successfully ${isOffer ? 'marked' : 'unmarked'} ${result.modifiedCount} products as offers`,
      updatedCount: result.modifiedCount,
      totalRequested: productIds.length,
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error updating bulk offers', 
        error: error.message 
      });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findOne({ id })
      .populate('category', 'name id description')
      .populate({
        path: 'reviews',
        match: { isActive: true },
        populate: {
          path: 'user',
          select: 'firstName lastName avatar'
        },
        options: { sort: { createdAt: -1 }, limit: 5 }
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is active (optional - you can remove this if you want to show inactive products)
    if (!product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    res.status(200).json({
      message: 'Product details retrieved successfully',
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ 
        message: 'Error fetching product details', 
        error: error.message 
      });
  }
};
