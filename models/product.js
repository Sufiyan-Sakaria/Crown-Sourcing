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
  image: {
    data: Buffer,
    contentType: String,
  },
  brand: {
    type: String,
    enum: ["Mix", "Acp"],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the model
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
