const express = require('express');
const OrderController = require('../controllers/OrderController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);
router.get('/',verifyToken,authorizeRole, OrderController.getAllOrders);
// router.put('/:id', OrderController.updateOrder);
router.delete('/:id',verifyToken,authorizeRole, OrderController.deleteOrder);
router.delete('/customer/:customerId',verifyToken,authorizeRole, OrderController.deleteOrderByCustomerId);
router.get('/customer/:customerId',verifyToken,authorizeRole, OrderController.getOrderByCustomerId);

module.exports = router;
