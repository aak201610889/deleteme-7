const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  Image: "String",
  Name: "String",
  Desc: "String",
  Price: "Number",
  Category: "String",
//   expensise: "Number",
});

module.exports = mongoose.model("Product", ProductSchema);
