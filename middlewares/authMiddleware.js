const jwt = require("jsonwebtoken");

const User = require("../models/User");
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).send({ error: "Please authenticate" });
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY20S);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send({ error: "Invalid token" });
  }
};

const authorizeRole = (req, res, next) => {
  if (req.user.role!=="***") {
    return res
      .status(403)
      .send({ error: "Access denied. Insufficient permissions." });
  }
  else{
    next();
  }
};



const verifySocketToken = (socket, next) => {
  const token =
    socket.handshake.query.token ||
    socket.handshake.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return next(new Error("Unauthorized"));
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY20S);
    socket.user = decoded; // Attach decoded user information to socket
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
};
const verifyAdminRole = async (socket, callback, next) => {
  const token =
    socket.handshake.query.token ||
    socket.handshake.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return callback({
      success: false,
      error: "Unauthorized: No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY20S);

    if (decoded.role !== "***") {
      return callback({
        success: false,
        error: "Forbidden: Admin role required",
      });
    }
    socket.user = decoded; // Attach decoded user information to socket
    next();
  } catch (err) {
    return callback({ success: false, error: "Invalid token" });
  }
};


const updateSocketId = async (socket) => {

  const { userId } = socket.handshake.query; 

  if (userId) {
    try {
      // Find the user by userId
      const user = await User.findById(userId);
      if (user) {
        // Check if the socketId is different
        if (user.socketId !== socket.id) {
          console.log(`Socket ID changed for user ${userId}: ${user.socketId} -> ${socket.id}`);
          user.socketId = socket.id; // Update the socketId in the user model
          
          // Emit an event to the client to clear local storage
          // socket.emit("clearLocalStorage");
    

          await user.save(); // Save the updated user
        }
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

 
};


module.exports = {
  updateSocketId,
  verifyToken,
  authorizeRole,
  verifyAdminRole,
  verifySocketToken,
};
