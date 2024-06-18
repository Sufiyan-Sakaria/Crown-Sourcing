const router = require("express").Router();
const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const { generateToken, verifyToken } = require("../utils/token");

router.get("/login", (req, res) => {
  res.render("auth/login");
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await userModel.findOne({ username }); // Find the user in the database
    if (!user) {
      return res.status(401).send("Invalid credentials"); // Send error if credentials are invalid
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Error logging in:", err.message);
        res.status(500).send("Error logging in"); // Send error response if login fails
      }
      if (!result) {
        return res.status(401).send("Invalid credentials"); // Send error if credentials are invalid
      }
      let token = generateToken(user);
      res.cookie("token", token);
      res.redirect("/");
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).send("Error logging in"); // Send error response if login fails
  }
});

router.get("/register", (req, res) => {
  res.render("auth/register");
});

router.post("/register", async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.error("Error registering user:", error.message);
        res.status(500).send("Error registering user");
      }
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          console.error("Error registering user:", error.message);
          res.status(500).send("Error registering user");
        }
        const User = await userModel.create({
          username,
          password: hash,
          isAdmin: isAdmin === "on",
        });

        let token = generateToken(User);
        res.cookie("token", token);
        res.redirect("/");
      });
    });
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).send("Error registering user");
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

module.exports = router;
