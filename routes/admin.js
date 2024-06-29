const isAdmin = require("../middlewares/isAdmin");
const isLoggedIn = require("../middlewares/isLoggedIn");
const router = require("express").Router();
const userModel = require("../models/user");
const productModel = require("../models/product");
const paymentModel = require("../models/payment");
const orderModel = require("../models/order");
const fs = require("fs");
const upload = require("../config/multer");
const path = require("path");

// Route to render home page for admin
router.get("/", isLoggedIn, isAdmin, async (req, res) => {
  let user = await userModel.findById(req.user._id.toString());
  let users = await userModel.find();
  let products = await productModel.find();
  let orders = await orderModel.find();
  let payments = await paymentModel.find();
  let path = req.originalUrl;
  res.render("admin/home", { user, users, path, products, orders, payments });
});

// Route to render the users page for admin
router.get("/users", isLoggedIn, isAdmin, async (req, res) => {
  let path = req.originalUrl;
  let user = await userModel.findById(req.user._id.toString());
  let users = await userModel.find();
  res.render("admin/users", { user, users, path });
});

// Route to render the edit the user
router.get("/user/edit/:id", isLoggedIn, isAdmin, async (req, res) => {
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
    const { username, Role } = req.body;

    // Set default role if Role is empty
    const role = Role || "User";

    await userModel.findByIdAndUpdate(req.params.id, {
      username,
      role: role,
    });

    req.flash("success_msg", "User updated successfully");
  } catch (err) {
    console.error(err);
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

// Route to render the products page
router.get("/products", isLoggedIn, isAdmin, (req, res) => {
  let path = req.originalUrl;
  productModel
    .find()
    .then((products) => {
      res.render("admin/products", { products, path });
    })
    .catch((err) => {
      console.error("Error fetching products:", err);
      res.status(500).send("Error fetching products");
    });
});

router.get("/product/add", isLoggedIn, isAdmin, (req, res) => {
  res.render("admin/createProduct");
});

router.post("/product/add", upload.single("image"), (req, res) => {
  const { name, description, price, category, stock } = req.body;

  let finalImg;

  console.log(req.file);

  if (req.file) {
    finalImg = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
  } else {
    // Use the default image
    const defaultImgPath = path.join(__dirname, "../public/images/default.jpg");
    const defaultImg = fs.readFileSync(defaultImgPath);
    finalImg = {
      data: defaultImg,
      contentType: "image/jpeg",
    };
  }

  const newProduct = new productModel({
    name,
    description,
    price,
    image: finalImg,
    category,
    stock,
  });

  newProduct
    .save()
    .then(() => {
      req.flash("success_msg", "Product created successfully");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      req.flash("error_msg", "Error creating product : " + err.message);
      res.redirect("/admin/products");
    });
});

// Route to render the edit form
router.get("/product/edit/:id", (req, res) => {
  productModel
    .findById(req.params.id)
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }
      res.render("admin/editProduct", { product });
    })
    .catch((err) => {
      req.flash("error_msg", "Error showing edit product : " + err.message);
      res.redirect("/admin/products");
    });
});

// Route to handle product update
router.post("/product/edit/:id", upload.single("image"), (req, res) => {
  const { name, description, price, category, stock } = req.body;

  productModel
    .findById(req.params.id)
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }

      product.name = name;
      product.description = description;
      product.price = price;
      product.category = category;
      product.stock = stock;

      if (req.file) {
        product.image = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      return product.save();
    })
    .then(() => {
      req.flash("success_msg", "Product updated successfully");
      res.redirect("/admin/products"); // Redirect to the products list
    })
    .catch((err) => {
      console.error("Error updating product:", err);
      res.status(500).send("Error updating product");
    });
});

// Route to handle product deletion
router.post("/product/delete/:id", (req, res) => {
  productModel
    .findByIdAndDelete(req.params.id)
    .then(() => {
      req.flash("success_msg", "Product deleted successfully");
      res.redirect("/admin/products"); // Redirect to the products list
    })
    .catch((err) => {
      req.flash("error_msg", "Error deleting product : " + err.message);
      res.redirect("/admin/products");
    });
});

router.get("/orders", isLoggedIn, isAdmin, async (req, res) => {
  try {
    let path = req.originalUrl;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default limit of items per page

    const count = await orderModel.countDocuments();
    const orders = await orderModel
      .find()
      .populate("user")
      .populate("items.productId")
      .sort({ createdAt: -1 }) // Optional: sort by creation date or any other field
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("admin/orders", {
      orders,
      path,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      limit,
      totalOrders: count,
    });
  } catch (error) {
    req.flash("error_msg", "Failed to load orders: " + error.message);
    res.redirect("/");
  }
});

// Route to update order status
router.post(
  "/orders/:orderId/status",
  isLoggedIn,
  isAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      const order = await orderModel
        .findById(orderId)
        .populate("items.productId"); // Assuming 'items.productId' is a reference to the product

      if (!order) {
        req.flash("error_msg", "Order not found");
        return res.redirect("/admin/orders");
      }

      // Update stock based on the new status
      if (status === "Rejected" && order.status !== "Rejected") {
        // Add items back to stock
        for (const item of order.items) {
          item.productId.stock += item.quantity; // Adjust this according to your product model's stock field
          await item.productId.save();
        }
      } else if (
        (status === "Approved" || status === "Pending") &&
        order.status === "Rejected"
      ) {
        // Remove items from stock
        for (const item of order.items) {
          item.productId.stock -= item.quantity; // Adjust this according to your product model's stock field
          await item.productId.save();
        }
      }

      order.status = status;
      await order.save();

      req.flash("success_msg", "Order status updated successfully");
      res.redirect("/admin/orders");
    } catch (error) {
      req.flash("error_msg", "Failed to update order status: " + error.message);
      res.redirect("/admin/orders");
    }
  }
);

// Route for admins to manage payments
router.get("/payments", async (req, res) => {
  try {
    let path = req.originalUrl;
    const payments = await paymentModel.find().populate("user");

    res.render("admin/payments", { payments, path });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to fetch payments: " + err.message);
    res.redirect("/admin");
  }
});

router.post("/payments/:id/approve", async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await paymentModel.findById(paymentId).populate("user");

    if (!payment) {
      req.flash("error_msg", "Payment not found");
      return res.redirect("/admin/payments");
    }

    if (payment.status === "Approved") {
      req.flash("error_msg", "Payment already approved");
      return res.redirect("/admin/payments");
    }

    payment.status = "Approved";
    await payment.save();

    payment.user.balance -= payment.amount;
    await payment.user.save();

    req.flash("success_msg", "Payment approved and balance updated");
    res.redirect("/admin/payments");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to approve payment: " + err.message);
    res.redirect("/admin/payments");
  }
});

router.post("/payments/:id/reject", async (req, res) => {
  try {
    const paymentId = req.params.id;
    const payment = await paymentModel.findById(paymentId).populate("user");

    if (!payment) {
      req.flash("error_msg", "Payment not found");
      return res.redirect("/admin/payments");
    }

    if (payment.status === "Rejected") {
      req.flash("error_msg", "Payment already rejected");
      return res.redirect("/admin/payments");
    }

    payment.status = "Rejected";
    await payment.save();

    req.flash("success_msg", "Payment rejected");
    res.redirect("/admin/payments");
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to reject payment: " + err.message);
    res.redirect("/admin/payments");
  }
});

module.exports = router;
