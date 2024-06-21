const router = require("express").Router();
const { login, register } = require("../controllers/auth");
const isAdmin = require("../middlewares/isAdmin");
const isLoggedIn = require("../middlewares/isLoggedIn");

// Route to render login form
router.get("/login", (req, res) => {
  try {
    res.render("auth/login"); // Render the login form
  } catch (error) {
    res.status(500).send("Error rendering login form: " + error.message); // Send error response if rendering fails
  }
});

// Route to handle login form submission
router.post("/login", async (req, res) => {
  try {
    await login(req, res); // Call the login controller function
  } catch (error) {
    res.status(500).send("Error during login: " + error.message); // Send error response if login fails
  }
});

// Route to render register form
router.get("/register", (req, res) => {
  try {
    res.render("auth/register"); // Render the register form
  } catch (error) {
    res.status(500).send("Error rendering register form: " + error.message); // Send error response if rendering fails
  }
});

// Route to handle register form submission
router.post("/register", async (req, res) => {
  try {
    await register(req, res); // Call the register controller function
  } catch (error) {
    req.flash("error_msg", `Error Registering User : ${error.message}`); // Send error response if registration fails
  }
});

// Route to handle user logout
router.get("/logout", (req, res) => {
  try {
    res.clearCookie("token"); // Clear the authentication token cookie
    res.redirect("/"); // Redirect to home page
  } catch (error) {
    res.status(500).send("Error during logout: " + error.message); // Send error response if logout fails
  }
});

module.exports = router;
