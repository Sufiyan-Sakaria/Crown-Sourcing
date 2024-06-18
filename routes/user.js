const isLoggedIn = require("../middlewares/isLoggedIn");
const router = require("express").Router();

router.get("/", isLoggedIn, (req, res) => {
  res.render("user/home");
});

module.exports = router;
