import Product from '../models/productModel.js';

export const generateProductId = async () => {
  try {
    const lastProduct = await Product.findOne().sort({ createdAt: -1 });
    if (!lastProduct) {
      return 'P001';
    }

    const lastId = lastProduct.id;
    const lastNumber = parseInt(lastId.substring(1), 10);
    const newNumber = lastNumber + 1;
    const newId = `P${newNumber.toString().padStart(3, '0')}`;

    return newId;
  } catch (error) {
    throw new Error('Error generating product ID');
  }
};
