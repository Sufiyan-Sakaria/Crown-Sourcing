const userModel = require("../models/user");
const Bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Controller function for user login
const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find the user in the database by username
    const user = await userModel.findOne({ username });

    // If user doesn't exist, redirect to request account
    if (!user) {
      return res.redirect("/auth/request");
    }

    // If password is correct, generate token and redirect to home page
    Bcrypt.compare(password, user.password, (err, result) => {
      if (!result) {
        return res.send("Invalid Password");
      } else {
        let payload = { username: user.username, id: user._id };
        let token = jwt.sign(payload, process.env.JWT_KEY);
        res.cookie("token", token);
        res.redirect("/");
      }
    });
  } catch (error) {
    // Send error response if login fails
    res.send(error.message);
  }
};

// Controller function for user registration
const register = async (req, res) => {
  const { username, password, Role } = req.body;
  try {
    // Create a new user in the database
    const newUser = await userModel.create({
      username,
      password: await Bcrypt.hash(password, 10),
      role: Role,
    });
    req.flash("success_msg", "User Created successfully");
    res.redirect("/admin/users");
  } catch (err) {
    // Send error response if registration fails
    req.flash("error_msg", "Error creating user : " + err.message);
  }
};

module.exports = { login, register };
