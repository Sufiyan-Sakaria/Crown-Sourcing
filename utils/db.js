const mongoose = require("mongoose");

// Function to connect to MongoDB
const connectToDatabase = () => {
  const uri = process.env.MONGODB_URI; // Get MongoDB URI from environment variables

  mongoose
    .connect(uri)
    .then(() => {
      console.log("Database connected succesfully"); // Log success message
    })
    .catch((err) => {
      console.error("Error connecting to Database:", err.message); // Log error message
    });
};

// export Mongoose connection
module.exports = connectToDatabase;
