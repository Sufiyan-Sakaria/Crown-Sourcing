// import mongoose
const mongoose = require("mongoose");

// Function to connect to MongoDB
const connectToDatabase = () => {
  const uri = process.env.MONGODB_URI; // Get MongoDB URI from environment variables

  if (!uri) {
    console.error("MONGODB_URI is not defined in the environment variables.");
    return;
  }

  mongoose
    .connect(uri)
    .then(() => {
      console.log("Database connected successfully"); // Log success message
    })
    .catch((err) => {
      console.error("Error connecting to Database:", err.message); // Log error message
    });
};

// Export Mongoose connection function
module.exports = connectToDatabase;
