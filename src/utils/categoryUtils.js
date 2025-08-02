import Category from '../models/categoryModel.js';

/**
 * Generate a URL-friendly slug from category name
 * @param {string} name - The category name
 * @returns {string} - The generated slug
 */
export const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Build ancestors array for hierarchical categories
 * @param {string} parentId - The parent category ObjectId
 * @returns {Array} - Array of ancestor objects
 */
export const buildAncestors = async (parentId) => {
  if (!parentId) return [];

  const parent = await Category.findById(parentId);
  if (!parent) return [];

  return [
    ...parent.ancestors,
    {
      _id: parent._id,
      name: parent.name,
      slug: parent.slug,
    },
  ];
};

/**
 * Check if a category name or slug already exists
 * @param {string} name - The category name
 * @param {string} slug - The category slug
 * @param {string} excludeId - Category ID to exclude from the check (for updates)
 * @returns {Object|null} - Existing category or null
 */
export const checkCategoryExists = async (name, slug, excludeId = null) => {
  const query = {
    $or: [
      { name: name.trim() },
      { slug: slug }
    ]
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return await Category.findOne(query);
};

/**
 * Validate if a parent category exists and is valid
 * @param {string} parentId - The parent category ObjectId
 * @returns {Object|null} - Parent category or null
 */
export const validateParentCategory = async (parentId) => {
  if (!parentId) return null;
  
  return await Category.findById(parentId);
};
