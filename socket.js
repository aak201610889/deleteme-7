const socketIo = require("socket.io");
const moment = require("moment");
const Order = require("./models/Order");
const userSessions = {};
const { verifyAdminRole, updateSocketId } = require("./middlewares/authMiddleware");
const {
  getWaitingOrders,
  createNewOrder,
  handleRejection,
  handleSuccess,
  handlePaid,
  PendingOrdersForCustomer,
  addProductInOrder,
  getAllUsersWithLatestSocket,
  deleteUserById,
} = require("./services");
const User = require("./models/User");
const Product = require("./models/Product");
const { socketErrorHandler } = require("./shared/socketErrorHandler");
const { default: mongoose } = require("mongoose");
let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`User connected with socket ID ${socket.id}`);
     updateSocketId(socket);
    socket.join("admin-room");
    socket.on(
      "orderCustomer",
      async ({ tableNumber, productsIds, customerId, comments }, callback) => {
        
        try {
          const user = await User.findById(customerId);
          if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return callback({ success: false, error: "Invalid customer ID format" });
        }
          if (user) {
            user.socketId = socket.id;
            await user.save();

            const orderByCustomer = await PendingOrdersForCustomer(customerId);

            if (orderByCustomer.length > 0) {
    
              const addProductOrder = await addProductInOrder(
                productsIds,
                orderByCustomer[0]._id,
                comments
              );
             
              

              io.to("admin-room").emit("orderAdmin", [addProductOrder]);
            } else {
        

              await createNewOrder(
                { tableNumber, productsIds },
                customerId,
                comments
              );
            }
            const orders = await getWaitingOrders();

        

            io.to("admin-room").emit("orderAdmin", orders);
            callback("ok");
          }
        } catch (error) {
          socketErrorHandler(socket, error);
        
        }
      }
    );

    //____________________________________________________
    socket.on("statusFromAdmin", async ({ orderId, status }, callback) => {
      verifyAdminRole(socket, callback, async () => {
        try {
          const order = await Order.findById(orderId).populate(
            "customerId",
            "username email socketId"
          );

          if (order && order.customerId && order.customerId.socketId) {
            console.log(
              "Emitting status to customer:",
              order.customerId.socketId
            );

            if (status === "rejected") {
              await handleRejection(orderId, "Reason for rejection");
              io.to(order.customerId.socketId).emit("getStatus", {
                orderId,
                status,
              });
              callback({ success: true, status, customerId: order.customerId });
              io.to(order.customerId.socketId).emit("getStatus", {
                orderId,
                status,
              });
            } else if (status === "approved") {
              await handleSuccess(orderId);
              callback({ success: true, status, customerId: order.customerId });
              io.to(order.customerId.socketId).emit("getStatus", {
                orderId,
                status,
              });
            } else if (status === "paid") {
              const { message, paymentStatus } = await handlePaid(
                orderId,
                order.customerId
              );
              callback({
                sucess: true,
                status: paymentStatus,
                message: message,
              });
              const customerSocket = await User.findById(order.customerId); // Fetch the user to get their socketId
             
              if (paymentStatus === "paid") {
                io.to(customerSocket.socketId).emit("getStatus", {
                  orderId,
                  status: "paid",
                });

                await User.findByIdAndDelete(order.customerId);
              }
            }
          } else {
            callback({ success: false, error: "Order or customer not found" });
            
          }
        } catch (error) {
          console.error("Error updating order status:", error);
          callback({ success: false, error: "An error occurred" });
          socketErrorHandler(socket, error);
        }
      });
    });

    socket.on("callGarson", async ({ tableNumber }, callback) => {
      try {
        if (tableNumber) {
          io.to("admin-room").emit("callgarsonToAdmin", tableNumber);
          callback("send successfully");
        }
      } catch (error) {
        console.error("Error call garson:", error);
      }
    });

    //____________________________________________________
    socket.on("getOrderByCustomerId", async ({ userId }, callback) => {
      const getOrderByCustoemrId = await Order.find({
        customerId: userId,
      }).sort({ createdAt: -1 });
   

      if (getOrderByCustoemrId) {
        callback(getOrderByCustoemrId);
      } else {
        callback("error");
      }
    });

    //____________________________________________________




    socket.on("approved", async (callback) => {
      const approvedOrder = await Order.find({
        status: "approved",
      }).sort({ createdAt: -1 });
      console.log("approvedOrder", approvedOrder);
      callback(approvedOrder);
    });

    socket.on("rejected", async (callback) => {
      const rejectedOrder = await Order.find({
        status: "rejected",
      }).sort({ createdAt: -1 });
      console.log("rejectedOrder", rejectedOrder);
      callback(rejectedOrder);
    });

    socket.on("pending", async (callback) => {
      const pendingOrder = await Order.find({
        status: "pending",
      }).sort({ createdAt: -1 });
      console.log("pendingOrder", pendingOrder);
      callback(pendingOrder);
    });

    socket.on("paid", async (callback) => {
      const paidOrder = await Order.find({
        status: "paid",
      }).sort({ createdAt: -1 });
      console.log("paidOrder", paidOrder);
      callback(paidOrder);
    });

    socket.on("getAllEarns", async (callback) => {
      try {
        const now = moment();

        // Start and end of today
        const startOfDay = now.clone().startOf("day").toDate();
        const endOfDay = now.clone().endOf("day").toDate();

        // Start and end of this month
        const startOfMonth = now.clone().startOf("month").toDate();
        const endOfMonth = now.clone().endOf("month").toDate();

        const [ordersToday, totalAmountTodayData, totalAmountMonthData] =
          await Promise.all([
            Order.find({
              status: "paid",
              createdAt: { $gte: startOfDay, $lte: endOfDay },
            }),
            Order.aggregate([
              {
                $match: {
                  status: "paid",
                  createdAt: { $gte: startOfDay, $lte: endOfDay },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountToday: { $sum: "$totalPrice" },
                },
              },
            ]),
            Order.aggregate([
              {
                $match: {
                  status: "paid",
                  createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                },
              },
              {
                $group: {
                  _id: null,
                  totalAmountMonth: { $sum: "$totalPrice" },
                },
              },
            ]),
          ]);

        callback({
          ordersToday,
          totalAmountToday: totalAmountTodayData[0]?.totalAmountToday || 0,
          totalAmountMonth: totalAmountMonthData[0]?.totalAmountMonth || 0,
        });
      } catch (error) {
        console.error("Error fetching orders:", error);
        callback({ error: "Error fetching orders" });
      }
    });

    socket.on("getAllProducts", async (callback) => {

      try {
        const allProducts = await Product.find().sort({ createdAt: -1 });
  
        callback(allProducts);
      } catch (error) {
        console.log("error getAllProducts =====>",error)
      }
    });



    //________________
  

    // socket.on("getAllUsersWithSocket", (callback) => {
    //   console.log("dddddwdlwpdlwplplplplplplplpl")
    //   verifyAdminRole(socket, async () => {
    //     try {
    //       await getAllUsersWithLatestSocket(callback);
    //     } catch (error) {
    //       socketErrorHandler(socket, error);
    //     }
    //   });
    // });
    
    // socket.on("deleteUser", (userId, callback) => {
    //   console.log("Deleting user with ID:", userId);
    //   verifyAdminRole(socket, async () => {
    //     try {
    //       // Delete the user and get the customer's socket information
    //       const customerSocket = await deleteUserById(userId);
          
    //       if (customerSocket) {
    //         console.log("=======socketId======>",customerSocket.socketId)
    //         // Emit the logout event to the specific customer's socket
    //         io.to(customerSocket.socketId).emit("logout", {
    //           status: "logged out",
    //         });
    //       }
    
    //       callback({ success: true, message: "User deleted successfully" }); // Notify admin about success
    //     } catch (error) {
    //       socketErrorHandler(socket, error);
    //       callback({ success: false, message: error.message }); // Notify the admin about the error
    //     }
    //   });
    // });
    
    
    





    socket.on("disconnect", async () => {
      console.log(`User with socket ID ${socket.id} disconnected`);
    });
  });

  return io;
}

module.exports = { initializeSocket, io };
