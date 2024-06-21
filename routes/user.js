const isLoggedIn = require("../middlewares/isLoggedIn");
const router = require("express").Router();

router.get("/", isLoggedIn, (req, res) => {
  let path = "/user";
  res.render("user/home", { path });
});

module.exports = router;
