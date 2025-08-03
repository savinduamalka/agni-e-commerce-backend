import Category from '../models/categoryModel.js';

/**
 * Generate a unique category ID
 * @param {string} name - The category name (not used in new format)
 * @returns {string} - The generated unique ID (format: C001, C002, etc.)
 */
export const generateCategoryId = async (name) => {
  // Find the highest existing category ID
  const lastCategory = await Category.findOne(
    { id: { $regex: /^C\d{3}$/ } }, // Match pattern C### (C followed by exactly 3 digits)
    {},
    { sort: { id: -1 } } // Sort by id in descending order to get the highest
  );

  let nextNumber = 1;

  if (lastCategory && lastCategory.id) {
    // Extract the number from the last category ID (e.g., "C005" -> 5)
    const lastNumber = parseInt(lastCategory.id.substring(1));
    nextNumber = lastNumber + 1;
  }

  // Format the number with leading zeros (e.g., 1 -> "001", 25 -> "025")
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  
  return `C${formattedNumber}`;
};

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
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
    },
  ];
};

/**
 * Check if a category name, slug, or id already exists
 * @param {string} name - The category name
 * @param {string} slug - The category slug
 * @param {string} categoryId - The category id
 * @param {string} excludeId - Category ObjectId to exclude from the check (for updates)
 * @returns {Object|null} - Existing category or null
 */
export const checkCategoryExists = async (name, slug, categoryId = null, excludeId = null) => {
  const orConditions = [
    { name: name.trim() },
    { slug: slug }
  ];

  if (categoryId) {
    orConditions.push({ id: categoryId });
  }

  const query = {
    $or: orConditions
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
