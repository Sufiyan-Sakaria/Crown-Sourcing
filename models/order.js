const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userOrderId: {
    type: Number,
    required: true,
  },
  globalOrderId: {
    type: Number,
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: { type: Number, required: true },
      price: { type: Number, default: 0 },
    },
  ],
  total: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  orderDate: { type: Date, default: Date.now },
  brand: { type: String, required: true },
});

orderSchema.pre("save", function (next) {
  let total = 0;
  this.items.forEach((item) => {
    total += item.quantity * item.price;
  });
  this.total = total;
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
