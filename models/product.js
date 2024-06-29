const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema
const productSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  image: {
    data: Buffer,
    contentType: String,
  },
  category: {
    type: String,
    enum: ["mix", "acp"],
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the model
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
