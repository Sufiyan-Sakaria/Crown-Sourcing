const userModel = require("../models/user");
const Bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Controller function for user login
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await userModel.findOne({ username });

    if (!user) {
      req.flash("error_msg", "Username is Incorrect");
      return res.redirect("/auth/login");
    }

    Bcrypt.compare(password, user.password, (err, result) => {
      if (!result) {
        req.flash("error_msg", "Invalid Password");
        return res.redirect("/auth/login");
      } else {
        let payload = { username: user.username, id: user._id };
        let token = jwt.sign(payload, process.env.JWT_KEY);
        res.cookie("token", token);
        res.redirect("/");
      }
    });
  } catch (error) {
    req.flash("error_msg", "Login failed. Please try again.");
    res.redirect("/auth/login");
  }
};

// Controller function for user registration
const register = async (req, res) => {
  const { username, password, Role } = req.body;

  try {
    // Set default role if Role is empty
    const role = Role || "User";

    // Create a new user in the database
    const newUser = await userModel.create({
      username,
      password: await Bcrypt.hash(password, 10),
      role: role,
    });

    req.flash("success_msg", "User Created successfully");
    res.redirect("/admin/users");
  } catch (err) {
    // Send error response if registration fails
    console.error(err);
    req.flash("error_msg", "Error creating user : " + err.message);
    res.redirect("/admin/users");
  }
};

module.exports = { login, register };
