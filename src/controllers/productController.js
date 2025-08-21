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

