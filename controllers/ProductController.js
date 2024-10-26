const ProductService = require('../services/ProductService');
const { validateProduct } = require('../validators/ProductValidator');

exports.createProduct = async (req, res) => {
  try {
    const image = req.file?.path || "";

    const newProduct={...req.body,Image:image}


    const { error } = validateProduct(newProduct);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const product = await ProductService.createProduct(newProduct);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    else{
      res.status(201).json(product);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort || null,
      search: req.query.search || null
    };

    const products = await ProductService.getAllProducts(req.query, options);
    res.status(200).json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    // Validate request data
    const { error } = validateProduct(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updatedProduct = await ProductService.updateProduct(req.params.id, req.body);
    if (!updatedProduct) return res.status(404).json({ error: 'Product not found' });
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await ProductService.deleteProduct(req.params.id);
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

