const express = require('express');
const ProductController = require('../controllers/ProductController');
const upload = require("../middlewares/upload");
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/',verifyToken,authorizeRole,  upload.single("Image"), ProductController.createProduct);
router.get('/:id', ProductController.getProductById);
router.get('/', ProductController.getAllProducts);
router.delete('/:id',verifyToken,authorizeRole, ProductController.deleteProduct);
module.exports = router;