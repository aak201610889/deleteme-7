const OrderService = require('../services/OrderService');
const { validateOrder } = require('../validators/OrderValidator');

exports.createOrder = async (req, res) => {
  try {
    // Validate request data
    const { error } = validateOrder(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const order = await OrderService.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const options = {
     
      sort: req.query.sort || null,
      search: req.query.search || null
    };

    const orders = await OrderService.getAllOrders(req.query, options);
    res.status(200).json(orders);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    // Validate request data
    const { error } = validateOrder(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updatedOrder = await OrderService.updateOrder(req.params.id, req.body);
    if (!updatedOrder) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const result = await OrderService.deleteOrder(req.params.id);
    if (!result) return res.status(404).json({ error: 'هذا الطلب غير موجود' });
    res.status(204).send({message:"تم الحذف بنجاح"});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};




exports.deleteOrderByCustomerId = async (req, res) => {
  try {
    const result = await OrderService.deleteOrderByCustomerId(req.params.customerId);
    if (!result) return res.status(404).json({ error: 'هذا الطلب غير موجود' });
    res.status(204).send({message:"تم الحذف بنجاح"});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
exports.getOrderByCustomerId = async (req, res) => {

  
  try {
    const order = await OrderService.getOrderByCustomerId(req.params.customerId);
    res.status(200).send(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};