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

router.get("/users/details/:id", async (req, res) => {
  try {
    // Function to format date as "YYYY-MM-DD HH:mm:ss"
    function formatDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = ("0" + (d.getMonth() + 1)).slice(-2);
      const day = ("0" + d.getDate()).slice(-2);

      return `${day}-${month}-${year}`;
    }

    let path = req.originalUrl;
    const userId = req.params.id;
    const user = await userModel
      .findById(userId)
      .populate({
        path: "payments",
        options: { sort: { createdAt: -1 }, limit: 2 },
      })
      .populate({
        path: "orders",
        options: { sort: { orderDate: -1 }, limit: 2 },
      });

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/admin/users");
    }

    res.render("admin/user-details", { user, path, formatDate });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to fetch user details" + err.message);
    res.redirect("/admin/users");
  }
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
router.get("/products", isLoggedIn, isAdmin, async (req, res) => {
  try {
    let path = req.originalUrl;

    // Fetch distinct brands and categories
    const brands = await productModel.distinct("brand");
    const categories = await productModel.distinct("category");

    // Fetch all products
    const products = await productModel.find();

    res.render("admin/products", { products, brands, categories, path });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send("Error fetching products");
  }
});

router.get("/product/add", isLoggedIn, isAdmin, (req, res) => {
  res.render("admin/createProduct");
});

router.post("/product/add", upload.single("image"), (req, res) => {
  const { name, description, category, brand, inStock } = req.body;

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
    image: finalImg,
    category,
    brand,
    inStock: inStock ? true : false,
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
  const { name, description, brand, category, inStock } = req.body;

  productModel
    .findById(req.params.id)
    .then((product) => {
      if (!product) {
        return res.status(404).send("Product not found");
      }

      product.name = name;
      product.description = description;
      product.brand = brand;
      product.category = category;
      product.inStock = inStock ? true : false;

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
      req.flash("error_msg", "Error Updating Product" + err.message);
      res.redirect("/admin/products");
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

// Route to view admin's orders with pagination, filtering, and sorting
router.get("/orders", async (req, res) => {
  try {
    let path = req.originalUrl;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const brand = req.query.brand;

    // Validate limit to prevent unreasonable values
    if (limit < 1 || limit > 50) {
      limit = 10; // Set default if limit is out of reasonable range
    }

    // Fetch all orders with populated products and user data
    const allOrders = await userModel.find({}).populate({
      path: "orders",
      populate: [
        {
          path: "items.productId",
          model: "Product",
        },
        {
          path: "user",
          model: "User",
        },
      ],
    });

    // Flatten orders array
    const orders = allOrders.flatMap((user) => user.orders);

    // Filter orders by brand if brand query parameter is provided
    let filteredOrders = orders;
    if (brand) {
      filteredOrders = filteredOrders.filter(
        (order) => order.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    // Sort filtered orders by status and then by date (recent first)
    filteredOrders.sort((a, b) => {
      const statusOrder = { Pending: 3, Approved: 2, Rejected: 1 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[b.status] - statusOrder[a.status];
      }
      return new Date(b.date) - new Date(a.date); // Sort by date descending for same status
    });

    // Pagination logic for admin's orders
    const totalOrders = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const ordersOnPage = filteredOrders.slice(startIndex, endIndex);

    res.render("admin/orders", {
      orders: ordersOnPage.map((order) => ({
        ...order.toObject(),
        brand: order.brand, // Add brand to order object
      })),
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit,
      brand, // Pass brand to template for filtering UI
      path,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to fetch admin orders: " + err.message);
    res.redirect("/admin"); // Handle error and redirect appropriately
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
        .populate("items.productId")
        .populate("user");

      if (!order) {
        req.flash("error_msg", "Order not found");
        return res.redirect("/admin/orders");
      }

      const user = order.user;
      if (!user) {
        req.flash("error_msg", "User not found");
        return res.redirect("/admin/orders");
      }

      // Calculate the total price of the order
      let orderTotal = 0;
      for (const item of order.items) {
        orderTotal += item.quantity * item.price;
      }

      if (status === "Approved" && order.status !== "Approved") {
        // Add order amount to the user's balance based on the brand
        if (order.brand === "Acp") {
          user.balanceACP += orderTotal;
        } else if (order.brand === "Mix") {
          user.balanceMix += orderTotal;
        }
      } else if (status === "Rejected" && order.status === "Approved") {
        // Subtract order amount from the user's balance based on the brand
        if (order.brand === "Acp") {
          user.balanceACP -= orderTotal;
        } else if (order.brand === "Mix") {
          user.balanceMix -= orderTotal;
        }
      }

      order.status = status;
      await order.save();
      await user.save();

      req.flash("success_msg", "Order status updated successfully");
      res.redirect("/admin/orders");
    } catch (error) {
      req.flash("error_msg", "Failed to update order status: " + error.message);
      res.redirect("/admin/orders");
    }
  }
);

// Route to update an order
router.post("/orders/:orderId/edit", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items, brand } = req.body;

    const order = await orderModel.findById(orderId);

    if (!order) {
      req.flash("error_msg", "Order not found");
      return res.redirect("/admin/orders");
    }

    // Clear existing items and update with new items
    order.items = [];
    let total = 0;

    for (let item of items) {
      const product = await productModel.findById(item.productId);

      if (!product) {
        req.flash("error_msg", `Product not found for ID: ${item.productId}`);
        return res.redirect(`/admin/orders/${orderId}/edit`);
      }

      const itemTotal = item.quantity * item.price;
      total += itemTotal;

      order.items.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }

    order.total = total;
    order.brand = brand;

    await order.save();

    req.flash("success_msg", "Order updated successfully");
    res.redirect("/admin/orders");
  } catch (error) {
    console.error(error);
    req.flash("error_msg", "Failed to update order: " + error.message);
    res.redirect("/admin/orders");
  }
});

// Route to get edit form for an order
router.get("/orders/:orderId/edit", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const path = req.originalUrl;
    const { orderId } = req.params;
    const order = await orderModel
      .findById(orderId)
      .populate("items.productId")
      .populate("user");

    if (!order) {
      req.flash("error_msg", "Order not found");
      return res.redirect("/admin/orders");
    }

    // Filter products by the brand of the order
    const products = await productModel.find({ brand: order.brand });

    res.render("admin/editOrder", { order, products, path });
  } catch (error) {
    req.flash("error_msg", "Failed to load order: " + error.message);
    res.redirect("/admin/orders");
  }
});

// Route for admins to manage payments
router.get("/payments", isLoggedIn, isAdmin, async (req, res) => {
  const { brand } = req.query;
  const query = brand ? { brand } : {};
  console.log(query);
  const path = req.originalUrl;
  try {
    const payments = await paymentModel.find(query).populate("user").exec();
    res.render("admin/payments", {
      payments,
      selectedbrand: brand,
      path,
    });
  } catch (error) {
    req.flash("error_,msg", "Failed to retrieve payments");
    res.redirect("/admin");
  }
});

router.post("/payments/:id/approve", isLoggedIn, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await paymentModel.findById(id).populate("user").exec();
    if (payment.status === "Pending") {
      payment.status = "Approved";
      await payment.save();

      // Update user balance based on payment brand
      if (payment.brand === "Acp") {
        payment.user.balanceACP -= payment.amount;
      } else if (payment.brand === "Mix") {
        payment.user.balanceMix -= payment.amount;
      }
      await payment.user.save();

      req.flash("success_msg", "Payment approved successfully");
    } else {
      req.flash("error_msg", "Payment has already been processed");
    }
  } catch (error) {
    req.flash("error_msg", "Failed to approve payment " + error.message);
  }
  res.redirect("/admin/payments");
});

router.post("/payments/:id/reject", isLoggedIn, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const payment = await paymentModel.findById(id).populate("user").exec();
    if (payment.status === "Pending") {
      payment.status = "Rejected";
      await payment.save();

      req.flash("success_msg", "Payment rejected successfully");
    } else {
      req.flash("error_msg", "Payment has already been processed");
    }
  } catch (error) {
    req.flash("error_msg", "Failed to reject payment " + error.message);
  }
  res.redirect("/admin/payments");
});

module.exports = router;
