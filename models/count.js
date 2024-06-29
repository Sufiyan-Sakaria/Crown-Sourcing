const mongoose = require("mongoose");

const countSchema = new mongoose.Schema({
  globalOrderCount: {
    type: Number,
    default: 0,
  },
  globalPaymentCount: {
    type: Number,
    default: 0,
  },
});

const Count = mongoose.model("Count", countSchema);

module.exports = Count;
