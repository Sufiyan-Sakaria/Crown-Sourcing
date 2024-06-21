const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    return next(); // Proceed if user is admin
  } else {
    return res.redirect("/user"); // Redirect non-admin users to the user page
  }
};

module.exports = isAdmin;
