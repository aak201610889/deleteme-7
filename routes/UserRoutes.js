const UserController = require('../controllers/UserController');
const { verifyToken, authorizeRole } = require('../middlewares/authMiddleware');
const router=require('express').Router()





router.post('/', UserController.createUser);
router.post('/admin/signupadmin2024', UserController.signupAdmin);
router.post('/admin/login', UserController.loginController);


//Todo:get All user delete and getById  if just hes admin
router.get('/getAdminWithCustomer',verifyToken,authorizeRole, UserController.getAllUserswithAdmin);
router.get('/:id', UserController.getUserById);
router.get('/',verifyToken,authorizeRole, UserController.getAllUesrs);
router.delete('/:id',verifyToken,authorizeRole, UserController.deleteUserById);



router.post('/getUser/:tableNumber', UserController.getUserTable);
router.post('/getUser', UserController.getUserId);




module.exports = router;