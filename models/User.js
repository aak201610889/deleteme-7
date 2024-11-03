const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: { type: String, required: true, unique: true },
    socketId: { type: String, default: null },
    role: {
      type: String,
      enum: ["Customer", "***"],
      default: 'Customer',
    },
    password: {
      type: String,
      validate: {
        validator: function (v) {
          // If the role is 'Admin', the password must be provided
          return this.role !== "***" || (v && v.length > 0);
        },
        message: "Password is required for 'Admin' role.",
      },
    },
    isReserved: { type: Boolean, default: false },
    tableNumber: {
      type: String,
      validate: {
        validator: function (v) {
          // tableNumber must be provided if the role is 'Customer'
          return this.role !== "Customer" || (v && v.length > 0);
        },
        message: "Table number is required for 'Customer' role.",
      },
    },
  },
  {
    toJSON: { versionKey: false },
    toObject: { versionKey: false },
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
