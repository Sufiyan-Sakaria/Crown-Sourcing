const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Get the token from the cookie

    if (!token) {
      return res.redirect("/auth/login"); // Redirect to login if not logged in
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await UserModel.findById(decoded.id); // Await the promise

    if (!user) {
      return res.redirect("/auth/login"); // Redirect to login if user not found
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).send(err.message); // Handle any errors
  }
};

module.exports = isLoggedIn;
