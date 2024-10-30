const Order = require('../models/Order');
const User = require('../models/User');

exports.createOrder = async (data) => {
  return await Order.create(data);
};

exports.getOrderById = async (id) => {
  return await Order.findById(id);
};

exports.getAllOrders = async (query, options = {}) => {
  const {  sort = null, search = {} } = options;



  let searchQuery = {};
  if (search && typeof search === 'object' && Object.keys(search).length > 0) {
    searchQuery = Object.keys(search).reduce((acc, key) => {
      const fieldType = Order.schema.paths[key]?.instance;

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

  const results = await Order
    .find(combinedQuery.search).populate('customerId', 'username email')
    .sort({ createdAt: -1 })
  
  const count = await Order.countDocuments();
  return {
    total: count,
    results
  };
};

exports.updateOrder = async (id, data) => {
  return await Order.findByIdAndUpdate(id, data, { new: true });
};

exports.deleteOrder = async (id) => {
  return await Order.findByIdAndDelete(id);
};


exports.deleteOrderByCustomerId = async (customerId) => {
  // Delete orders for the customer with specific statuses
  await Order.where("customerId")
    .equals(customerId)
    .where("status")
    .in(["pending", "approved", "rejected"])
    .deleteMany();

 
  return await User.findByIdAndDelete(customerId);
};


exports.getOrderByCustomerId = async (customerId) => {
  const orders= await Order.where("customerId")
  .equals(customerId)
  .where("status")
  .in(["pending", "approved", "rejected"]).find();
   return orders
};




