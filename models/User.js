const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String },
    email: { type: String, required: true, unique: true },
    socketId: { type: String, default: null },
    role: {
      type: String,
      enum: ["Customer", "***"],
    },
    password: {
      type: String,
      validate: {
        validator: function (v) {
          // If the role is 'Admin', the password must be provided
          return this.role !== "***" || (v && v.length > 0);
        },
        message: (props) => `Password is required for 'Admin' role.`,
      },
    },

    tableNumber: { type: String },
  },
  {
    toJSON: { versionKey: false }, // Exclude __v in JSON representation
    toObject: { versionKey: false }, // Exclude __v in object representation
  }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
