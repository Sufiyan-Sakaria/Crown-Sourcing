const userModel = require("../models/user");
const { hashPassword, verifyPassword } = require("../utils/Bycrypt");
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
    if (verifyPassword(password, user, res)) {
      let payload = { username: user.username, id: user._id };
      let token = jwt.sign(payload, process.env.JWT_KEY);
      res.cookie("token", token);
      res.redirect("/");
    } else {
      res.send("incorrrect Password");
    }
  } catch (error) {
    // Send error response if login fails
    res.send(error.message);
  }
};

// Controller function for user registration
const register = async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    // Create a new user in the database
    const newUser = await userModel.create({
      username,
      password: hashPassword(password, res),
      isAdmin: isAdmin === "on",
    });

    // Generate token for the new user and redirect to home page
    let payload = { username: newUser.username, id: newUser._id };
    let token = jwt.sign(payload, process.env.JWT_KEY);
    res.cookie("token", token);
    res.redirect("/");
  } catch (err) {
    // Send error response if registration fails
    res.send(err.message);
  }
};

module.exports = { login, register };
