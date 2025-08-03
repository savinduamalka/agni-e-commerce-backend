import Category from '../models/categoryModel.js';
import mongoose from 'mongoose';
import {
  generateSlug,
  generateCategoryId,
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
      .populate('parent', 'id name slug')
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

// Get all categories 
export const getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      featured,
      parent,
      active,
      sort = 'name',
    } = req.query;

    // Build filter object - Admin can see all categories
    const filter = {};

    // Filter by active status (optional for admin)
    if (active !== undefined && active !== 'all') {
      filter.isActive = active === 'true';
    }

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
      case 'updated':
        sortOptions.updatedAt = 1;
        break;
      case '-updated':
        sortOptions.updatedAt = -1;
        break;
      default:
        sortOptions.name = 1;
    }

    // Execute query with pagination
    const categories = await Category.find(filter)
      .populate('parent', 'id name slug isActive')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Category.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    // Get summary statistics for admin dashboard
    const stats = await Category.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          inactiveCategories: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
          },
          featuredCategories: {
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] },
          },
          rootCategories: {
            $sum: { $cond: [{ $eq: ['$parent', null] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'All categories retrieved successfully',
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
        statistics: stats[0] || {
          totalCategories: 0,
          activeCategories: 0,
          inactiveCategories: 0,
          featuredCategories: 0,
          rootCategories: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error retrieving all categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Update category 
export const updateCategory = async (req, res) => {
  try {
    const { id: categoryId } = req.params; 
    const { name, description, image, parent, isFeatured, isActive } = req.body;

    // Validate category ID format 
    if (!categoryId || !/^C\d{3}$/.test(categoryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format. Expected format: C001, C002, etc.',
      });
    }

    // Find the existing category by the custom ID field
    const existingCategory = await Category.findOne({ id: categoryId });
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Build update object
    const updateData = {};

    // Update name and slug if name is provided
    if (name && name.trim() && name.trim() !== existingCategory.name) {
      const newSlug = generateSlug(name);
      
      // Check if new name or slug already exists (excluding current category)
      const duplicateCategory = await checkCategoryExists(name, newSlug, null, existingCategory._id);
      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category with this name or slug already exists',
        });
      }
      
      updateData.name = name.trim();
      updateData.slug = newSlug;
    }

    // Update other fields
    if (description !== undefined) {
      updateData.description = description?.trim() || '';
    }
    if (image !== undefined) {
      updateData.image = image || '';
    }
    if (isFeatured !== undefined) {
      updateData.isFeatured = Boolean(isFeatured);
    }
    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Handle parent category change
    if (parent !== undefined) {
      if (parent === null || parent === '') {
        // Making it a root category
        updateData.parent = null;
        updateData.ancestors = [];
      } else {
        // Validate parent category
        if (!mongoose.Types.ObjectId.isValid(parent)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid parent category ID format',
          });
        }

        // Check if parent exists
        const parentCategory = await validateParentCategory(parent);
        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: 'Parent category not found',
          });
        }

        // Prevent circular reference (category cannot be its own parent or descendant)
        if (parent === existingCategory._id.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Category cannot be its own parent',
          });
        }

        // Check if the new parent is not a descendant of current category
        const descendants = await Category.find({
          'ancestors._id': existingCategory._id
        });
        
        const isDescendant = descendants.some(desc => desc._id.toString() === parent);
        if (isDescendant) {
          return res.status(400).json({
            success: false,
            message: 'Cannot set a descendant category as parent (circular reference)',
          });
        }

        updateData.parent = parent;
        updateData.ancestors = await buildAncestors(parent);
      }
    }

    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(
      existingCategory._id,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('parent', 'id name slug isActive');

    // If parent was changed, update all descendants' ancestors
    if (parent !== undefined) {
      await updateDescendantsAncestors(existingCategory._id);
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory,
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

// Helper function to update descendants' ancestors when parent changes
const updateDescendantsAncestors = async (categoryId) => {
  try {
    // Get the updated category with its new ancestors
    const updatedCategory = await Category.findById(categoryId);
    if (!updatedCategory) return;

    // Find all direct children
    const children = await Category.find({ parent: categoryId });

    // Update each child's ancestors
    for (const child of children) {
      const newAncestors = [
        ...updatedCategory.ancestors,
        {
          _id: updatedCategory._id,
          id: updatedCategory.id,
          name: updatedCategory.name,
          slug: updatedCategory.slug,
        },
      ];

      await Category.findByIdAndUpdate(child._id, {
        ancestors: newAncestors,
      });

      // Recursively update grandchildren
      await updateDescendantsAncestors(child._id);
    }
  } catch (error) {
    console.error('Error updating descendants ancestors:', error);
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  try {
    const { id, name, description, image, parent, isFeatured } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Generate slug and ID from name
    const slug = generateSlug(name);
    const categoryId = id ? id.trim() : await generateCategoryId(name);

    // Check if category with same name, slug, or id already exists
    const existingCategory = await checkCategoryExists(name, slug, categoryId);

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name, slug, or ID already exists',
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
      id: categoryId,
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
