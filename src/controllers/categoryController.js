import Category from '../models/categoryModel.js';
import mongoose from 'mongoose';
import {
  generateSlug,
  buildAncestors,
  checkCategoryExists,
  validateParentCategory,
} from '../utils/categoryUtils.js';

export const getActiveCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, featured, parent, sort = 'name' } = req.query;

    // Build filter object - Only show active categories for public access
    const filter = {
      isActive: true, // Always filter for active categories only
    };

    // Filter by featured status
    if (featured !== undefined) {
      filter.isFeatured = featured === 'true';
    }

    // Filter by parent category
    if (parent) {
      if (parent === 'root') {
        filter.parent = null; // Root categories
      } else if (mongoose.Types.ObjectId.isValid(parent)) {
        filter.parent = parent;
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case 'name':
        sortOptions.name = 1;
        break;
      case '-name':
        sortOptions.name = -1;
        break;
      case 'created':
        sortOptions.createdAt = 1;
        break;
      case '-created':
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query with pagination
    const categories = await Category.find(filter)
      .populate('parent', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Category.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: {
        categories,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, parent, isFeatured } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Generate slug from name
    const slug = generateSlug(name);

    // Check if category with same name or slug already exists
    const existingCategory = await checkCategoryExists(name, slug);

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    // Validate parent category if provided
    let ancestors = [];
    if (parent) {
      // Validate if parent is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(parent)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID format',
        });
      }

      const parentCategory = await validateParentCategory(parent);
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found',
        });
      }
      ancestors = await buildAncestors(parent);
    }

    // Create new category
    const newCategory = new Category({
      name: name.trim(),
      slug,
      description: description?.trim() || '',
      image: image || '',
      parent: parent || null,
      ancestors,
      isFeatured: isFeatured || false,
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: savedCategory,
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};
