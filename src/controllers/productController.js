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
