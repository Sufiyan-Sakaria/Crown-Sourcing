const mongoose = require("mongoose");

// Define the schema for User
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // User's username
  password: { type: String, required: true }, // User's password
  isAdmin: { type: Boolean, default: false }, // Flag to indicate if the user is an admin
  cart: {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        }, // Reference to Product
        quantity: { type: Number, required: true }, // Quantity of the product
      },
    ],
    total: { type: Number, default: 0 }, // Total price of items in the cart
  },
  orders: [
    {
      orderDate: { type: Date, default: Date.now }, // Date of the order
      items: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          }, // Reference to Product
          quantity: { type: Number, required: true }, // Quantity of the product
        },
      ],
      total: { type: Number, required: true }, // Total price of the order
    },
  ],
  balance: { type: Number, default: 0 }, // User's account balance
});

// Create User model from the schema
const User = mongoose.model("User", userSchema);

module.exports = User; // Export the User model
