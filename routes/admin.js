const isAdmin = require("../middlewares/isAdmin");
const isLoggedIn = require("../middlewares/isLoggedIn");
const router = require("express").Router();
const userModel = require("../models/user");

// Route to render home page for admin
router.get("/", isLoggedIn, isAdmin, async (req, res) => {
  let user = await userModel.findById(req.user._id.toString());
  let users = await userModel.find();
  let path = "/admin";
  res.render("admin/home", { user, users, path });
});

// Route to render the users page for admin
router.get("/users", isLoggedIn, isAdmin, async (req, res) => {
  let path = "/users";
  let user = await userModel.findById(req.user._id.toString());
  let users = await userModel.find();
  res.render("admin/users", { user, users, path });
});

// Route to render the edit the user
router.get("/user/edit/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/admin/users");
    }
    res.render("admin/editUser", { user });
  } catch (err) {
    req.flash("error_msg", "Error fetching user details");
    res.redirect("/admin/users");
  }
});

// Route to update a user
router.post("/user/edit/:id", async (req, res) => {
  try {
    const { username, password, Role } = req.body;
    await userModel.findByIdAndUpdate(req.params.id, {
      username,
      password,
      role: Role,
    });
    req.flash("success_msg", "User updated successfully");
  } catch (err) {
    req.flash("error_msg", "Error updating user : " + err.message);
  }
  res.redirect("/admin/users");
});

// Route to delete a user
router.post("/user/delete/:id", async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "User deleted successfully");
  } catch (err) {
    req.flash("error_msg", `Error deleting user : ${err.message}`);
  }
  res.redirect("/admin/users");
});

module.exports = router;
