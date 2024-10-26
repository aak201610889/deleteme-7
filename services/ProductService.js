const Order = require('../models/Order');
const Product = require('../models/Product');

exports.createProduct = async (data) => {
  return await Product.create(data);
};

exports.getProductById = async (id) => {
  return await Product.findById(id);
};

exports.getAllProducts = async (query, options = {}) => {
  const { page = 1, limit = 10, sort = null, search = {} } = options;

  if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
    throw new Error('Invalid page or limit values');
  }

  let searchQuery = {};
  if (search && typeof search === 'object' && Object.keys(search).length > 0) {
    searchQuery = Object.keys(search).reduce((acc, key) => {
      const fieldType = Product.schema.paths[key]?.instance;

      if (fieldType === 'String') {
        acc[key] = { $regex: search[key], $options: 'i' };
      } else {
        acc[key] = search[key];
      }

      return acc;
    }, {});
  }

  let sortQuery = {};
  if (sort) {
    const sortFields = sort.split(',').map(field => field.trim());
    sortQuery = sortFields.reduce((acc, field) => {
      const [key, order] = field.split(':');
      acc[key] = order === 'desc' ? -1 : 1;
      return acc;
    }, {});
  }

  const combinedQuery = { ...query, ...searchQuery };

  const results = await Product
    .find(combinedQuery.search)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const count = await Product.countDocuments();
  return {
    total: count,
    page,
    limit,
    results
  };
};

exports.updateProduct = async (id, data) => {
  return await Product.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};



exports.createOrder = async (items,customerId) => {
 
};
