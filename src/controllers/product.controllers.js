import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
  try {
    const foundProducts = await Product.find({});
    return res.json({
      products: foundProducts,
    });
  } catch (err) {
    return res.status(400).json({
      message: "Error while fetching products",
    });
  }
};

export const getProductById = async (req, res) => {
  console.log("*********req.params", req.params);
  const { id } = req.params;
  try {
    const foundProduct = await Product.findOne({ id });
    if (!foundProduct) {
      return res.status(400).json({
        message: "Product not found",
      });
    }
  
    return res.status(200).json({
      product: foundProduct,
    });
  } catch (err) {
    return res.status(400).json({
      message: `Product not found - ${err.message}`,
    });
  }
};