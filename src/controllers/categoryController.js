import Category from '../models/categoryModel.js';
import mongoose from 'mongoose';
import { 
  generateSlug, 
  buildAncestors, 
  checkCategoryExists, 
  validateParentCategory 
} from '../utils/categoryUtils.js';

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
