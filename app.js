// Import required modules
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const isLoggedIn = require("./middlewares/isLoggedIn");

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Middleware setup for express session and flash session
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());

// Middleware to set flash messages in response locals
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  /* The line `res.locals.error_msg = req.flash("error_msg");` is setting a local variable `error_msg`
  in the response object `res`. */
  res.locals.error_msg = req.flash("error_msg");
  next();
});

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up static file serving
app.use(express.static(path.join(__dirname, "public")));

// Set up view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Set up Middleware for Cookie Parser
app.use(cookieParser());

// Connect to Database
const connectToDatabase = require("./utils/db");
connectToDatabase();

// Basic route
app.get("/", isLoggedIn, (req, res) => {
  if (req.user.role === "Admin") {
    res.redirect("/admin"); // Redirect admin to admin page
  } else {
    res.redirect("/user"); // Redirect non-admin user to user page
  }
});
// Import Auth route
const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

// Import User route
const userRouter = require("./routes/user");
app.use("/user", userRouter);

// Import Admin route
const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);

// Set the port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
