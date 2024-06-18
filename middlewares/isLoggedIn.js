const jwt = require("jsonwebtoken");

const isLoggedIn = (req, res, next) => {
  const token = req.cookies.token; // Get the token from the cookie

  if (!token) {
    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = decoded; // Add the decoded user information to the request object
    next(); // Move to the next middleware/route handler
  } catch (err) {
    return res.status(401).send(err.message);
  }
};

module.exports = isLoggedIn;
