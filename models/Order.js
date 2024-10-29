const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for an Order
const OrderSchema = new Schema({
  table: {
    type: Number,
    required: true,
  },
  products: [
    {
      id: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      category: {
        type: String,
      
      },
      image: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },

      total: {
        type: Number,
        required: true,
      },
    },
  ],
  totalPrice: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  comments:[ { type: String, default: "" }],
});

// Create the Order model
const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
