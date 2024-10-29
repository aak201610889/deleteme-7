const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
exports.login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid login credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid login credentials");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.SECRETKEY20S,
    {
      expiresIn: "230d",
    }
  );
  const userWithoutPassword = user.toObject();
  delete userWithoutPassword.password;

  return { token, user: userWithoutPassword };
};

exports.signupAdmin = async (data) => {
  const password = data.password;

  const hashedPassword = await bcrypt.hash(password, 8);

  const user = await User.create({
    ...data,
    role: "***",
    password: hashedPassword,
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.SECRETKEY20S,
    {
      expiresIn: "6h", // Token expires in 1 hour
    }
  );
  const userWithoutExtensions = user.toObject();
  delete userWithoutExtensions.password;
  delete userWithoutExtensions.role;

  delete userWithoutExtensions.password;
  return { user: userWithoutExtensions, token };
};

exports.createUser = async (username, email, tableNumber) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const newUser = new User({
    username,
    email,
    socketId: null,
    tableNumber,
  });

  try {
    const savedUser = await newUser.save();
    return savedUser;
  } catch (error) {
    throw new Error(error);
  }
};

exports.getAllUserswithAdmin = async () => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });
    return users;
  } catch (error) {
    throw new Error(`Error retrieving users: ${error.message}`);
  }
};


exports.getAllUesrs = async () => {
  try {
    const users = await User.find({ role: { $ne: "***" } }).sort({
      createdAt: -1,
    });

    return users;
  } catch (error) {
    throw new Error(`Error retrieving users: ${error.message}`);
  }
};




exports.getUserById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID format");
    }
    const deletedUser = await User.findById(id);
    if (!deletedUser) {
      throw new Error("User not found");
    }
    return deletedUser;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error(error.message);
  }
};

exports.deleteUserById = async (id) => {
  try {
    const userById = await User.findByIdAndDelete(id);

    return userById;
  } catch (error) {
    throw new Error(error);
  }
};

exports.getUserTable = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user.tableNumber) {
      return new Error("error You have other User Id please check with admin");
    } else {
      return user.tableNumber;
    }
  } catch (error) {
    throw new Error(error);
  }
};

exports.getUserId = async (id) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      return new Error("User not found. Please check with admin.");
    } else {
      return user._id;
    }
  } catch (error) {
    throw new Error(error.message || "An unexpected error occurred.");
  }
};
