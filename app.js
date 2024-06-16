// Import required modules
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up static file serving
app.use(express.static(path.join(__dirname, "public")));

// Set up view engine

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Basic route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Import Auth route
const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

// Set the port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
