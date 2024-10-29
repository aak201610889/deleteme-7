const { default: mongoose } = require("mongoose");
const Order = require("./models/Order");
const Product = require("./models/Product");
const User = require("./models/User");
const { SocketError } = require("./shared/socketErrorHandler");

const createNewOrder = async (productsItem, customerId, comments) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      throw new Error("Invalid customer ID format");
    }
    //get ptoducts as ids
    const productIds = productsItem.productsIds?.map((item) => item.id);
    //get all prodcts as ids and make it full as [{id:1,item:cheese}]
    const products = await Product.find({ _id: { $in: productIds } });

    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    let totalPrice = 0;

    const detailedProducts = productsItem.productsIds
      .map((item) => {
        const { id, quantity } = item;
        const product = productMap[id];

        if (product) {
          const price = product.Price;
          totalPrice += price * quantity;
          return {
            id: product._id,
            name: product.Name,
            category: product.Category,
            image: product.Image,
            price: price,
            quantity: quantity,

            total: price * quantity,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    const newOrder = {
      table: productsItem.tableNumber,
      products: detailedProducts,
      totalPrice: totalPrice,
      customerId: customerId,
      comments: comments,
    };
    return await Order.create(newOrder);
  } catch (error) {
    throw new SocketError("هناك مشكلة في إنشاء الطلب", 500);
  }
};

const getWaitingOrders = async () => {
  try {
    const orders = await Order.find({ status: "pending" })
      .populate("customerId", "username email")
      .sort({ createdAt: -1 });

    return orders;
  } catch (error) {
   
    throw new SocketError(` هناك مشكلة في  الطلبات قيد الانتظار : ${error}`, 500);

  }
};

const handleRejection = async (orderId, reason) => {
  try {
    const update = { status: "rejected", reason: reason };
    await Order.findByIdAndUpdate(orderId, update, { new: true });
    console.log(`Order ${orderId} has been rejected successfully.`);
  } catch (error) {
    throw new SocketError(` هناك مشكلة في التعامل مع  رفض الطلب : ${error}`, 500);

  }
};

const handleSuccess = async (orderId) => {
  try {
    // Fetch the order to check its customer
    const order = await Order.findById(orderId).populate("customerId");

    if (!order) {
      console.error("Order not found");
      return;
    }

    // Check for approved orders for the same customer
    const approvalOrders = await Order.find({
      customerId: order.customerId._id,
      status: "approved",
    });

    if (approvalOrders.length > 0) {
      // Logic to merge items from this order into existing approved orders
      for (const approvedOrder of approvalOrders) {
        for (const product of order.products) {
          const existingProduct = approvedOrder.products.find(
            (p) => p.id.toString() === product._id.toString()
          );
          if (existingProduct) {
            // If the product already exists, increase the quantity and update total
            existingProduct.quantity += product.quantity;
            existingProduct.total += product.total;
          } else {
            approvedOrder.products.push(product);
          }
        }
        approvedOrder.totalPrice += order.totalPrice; // Update total price
        await approvedOrder.save();
      }

      console.log(`Merged order ${orderId} with existing approved orders.`);

      // Delete the pending order
      await Order.findByIdAndDelete(orderId);
      console.log(`Deleted pending order ${orderId}.`);
    } else {
      const update = { status: "approved" };
      await Order.findByIdAndUpdate(orderId, update, { new: true });
      console.log(`Order ${orderId} has been approved successfully.`);
    }
  } catch (error) {
    console.error("Error handling success:", error);
    throw new SocketError(` هناك مشكلة في التعامل مع  نجاح الطلب : ${error}`, 500);



  }
};

const handlePaid = async (orderId, customerId) => {
  try {
    const pendingOrders = await Order.find({
      customerId: customerId,
      status: "pending",
    });

    if (pendingOrders.length > 0) {
      return {
        paymentStatus: "paymentBlockedDueToPendingOrders",
        message: `There are ${pendingOrders.length} pending orders. Please resolve them first.`,
      };
    } else {
      const update = { status: "paid" };
      await Order.findByIdAndUpdate(orderId, update, { new: true });

      console.log(`Order ${orderId} has been paid successfully.`);
      return {
        paymentStatus: "paid",
        message: `There isn't any pending order.`,
      };
    }
  } catch (error) {
    throw new SocketError(` هناك مشكلة في دفع الطلب: ${error}`, 500);
  }
};

const PendingOrdersForCustomer = async (customerId) => {
  try {
    const orders = await Order.find({
      customerId: customerId,
      status: "pending",
    })
      .populate("customerId", "username email")
      .sort({ createdAt: -1 });
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new SocketError("هناك مشكلة في جلب الطلبات", 500);
  }
};

const addProductInOrder = async (productsItems, orderId, comments) => {
  try {
    const productIds = productsItems.map((item) => item.id);
    const newProducts = await Product.find({ _id: { $in: productIds } });

    const order = await Order.findById(orderId).populate("products");
    if (!order) throw new Error(`Order with ID ${orderId} not found.`);

    const existingProductsMap = order.products.reduce((acc, p) => {
      acc[p.id.toString()] = p;
      return acc;
    }, {});

    let totalPrice = 0;
    const updatedProductsMap = { ...existingProductsMap }; // Create a copy to update

    productsItems.forEach((item) => {
      const { id, quantity } = item;
      const product = newProducts.find((p) => p._id.toString() === id);

      if (product) {
        const price = product.Price;
        const total = price * quantity;

        if (updatedProductsMap[id]) {
          updatedProductsMap[id].quantity += quantity;
          updatedProductsMap[id].total =
            updatedProductsMap[id].price * updatedProductsMap[id].quantity;
        } else {
          // Add new product
          updatedProductsMap[id] = {
            id: product._id,
            name: product.Name,
            CATEGORY: product.Category,
            image: product.Image,
            price: product.Price,
            quantity,
            total,
          };
        }
      }
    });

    // Convert the updatedProductsMap to an array
    const finalProductsList = Object.values(updatedProductsMap);

    // Calculate the totalPrice from the final list of products
    totalPrice = finalProductsList.reduce((sum, p) => sum + p.total, 0);

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { products: finalProductsList, totalPrice, comments: comments },
      { new: true }
    );

    // console.log("Updated order:", updatedOrder);
    return updatedOrder;
  } catch (error) {
    throw new SocketError("هناك مشكلة في تعديل الطلب", 500);
  }
};

const getAllUsersWithLatestSocket = async (callback) => {
  try {
    const users = await User.find().sort({ updatedAt: -1 });
    callback(users);
  } catch (error) {
    throw new SocketError("هناك مشكلة في احضار الزبائن", 500);
  }
};

const deleteUserById = async (userId) => {
  try {
    const user = await User.findById(userId); // Find the user to get their socket ID
    const result = await User.deleteOne({ _id: userId });

    if (result.deletedCount > 0) {
      // Return the customer's socket information
      return { socketId: user.socketId }; // Assuming the socket ID is stored in the user document
    } else {
      throw new SocketError("الزبون غير موجود", 404);
    }
  } catch (error) {
    throw new SocketError("هناك مشكلة في حذف الزبون", 500);
  }
};





module.exports = {
  getAllUsersWithLatestSocket,
  deleteUserById,
  handleSuccess,
  handleRejection,
  handlePaid,
  getWaitingOrders,
  createNewOrder,
  PendingOrdersForCustomer,
  addProductInOrder,
};
