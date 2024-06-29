const isLoggedIn = require("../middlewares/isLoggedIn");
const userModel = require("../models/user");
const productModel = require("../models/product");
const paymentModel = require("../models/payment");
const orderModel = require("../models/order");
const router = require("express").Router();
const Count = require("../models/count");

router.get("/", isLoggedIn, async (req, res) => {
  const path = "/users";
  const user = await userModel.findOne(req.user._id);

  // Get search, pagination, and sorting parameters from the query string
  const search = req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const sort = req.query.sort || "stock"; // Default to sorting by stock

  // Create a filter object for search
  const filter = search ? { name: { $regex: search, $options: "i" } } : {};

  // Determine the sort order
  let sortOrder;
  switch (sort) {
    case "a-z":
      sortOrder = { name: 1 };
      break;
    case "z-a":
      sortOrder = { name: -1 };
      break;
    case "price-high-low":
      sortOrder = { price: -1 };
      break;
    case "price-low-high":
      sortOrder = { price: 1 };
      break;
    case "stock":
    default:
      sortOrder = { stock: -1 };
  }

  // Calculate the total number of products and total pages
  const totalProducts = await productModel.countDocuments(filter);
  const totalPages = Math.ceil(totalProducts / limit);

  // Fetch the products with the applied filters, pagination, and sorting
  const products = await productModel
    .find(filter)
    .sort(sortOrder)
    .skip((page - 1) * limit)
    .limit(limit);

  res.render("user/home", {
    path,
    user,
    products,
    totalPages,
    currentPage: page,
    search,
    sort,
    limit,
  });
});

router.get("/product/:id", isLoggedIn, async (req, res) => {
  let path = "/users";
  let user = await userModel.findOne(req.user._id);
  let product = await productModel.findById(req.params.id);
  res.render("user/product", { product, path, user });
});

router.get("/cart/:id", isLoggedIn, async (req, res) => {
  try {
    let path = "/cart";
    const user = await userModel
      .findById(req.params.id)
      .populate("cart.items.productId");

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user");
    }

    const category = req.query.c;
    let filteredItems = user.cart.items;

    if (category) {
      filteredItems = filteredItems.filter(
        (item) => item.productId.category === category
      );
    }

    const totalQuantity = filteredItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.render("user/cart", {
      user,
      filteredItems,
      totalQuantity,
      success_msg: req.flash("success_msg"),
      error_msg: req.flash("error_msg"),
      path,
    });
  } catch (error) {
    req.flash("error_msg", "An error occurred while fetching the cart");
    res.redirect("/user");
  }
});

router.post("/cart/add", isLoggedIn, async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    // Check if all required parameters are provided
    if (!userId || !productId || !quantity) {
      req.flash("error_msg", "Missing required parameters");
      return res.redirect("back");
    }

    // Parse and validate quantity
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      req.flash("error_msg", "Invalid quantity");
      return res.redirect("back");
    }

    const user = await userModel.findById(userId);
    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("back");
    }

    const product = await productModel.findById(productId);
    if (!product) {
      req.flash("error_msg", "Product not found");
      return res.redirect("back");
    }

    // Validate product price
    if (isNaN(product.price)) {
      req.flash("error_msg", "Invalid product price");
      return res.redirect("back");
    }

    // Find the cart item
    const cartItem = user.cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity += parsedQuantity;
    } else {
      user.cart.items.push({ productId, quantity: parsedQuantity });
    }

    // Save the user document
    await user.save();

    req.flash("success_msg", "Product added to cart");
    res.redirect("/user/cart/" + userId);
  } catch (error) {
    console.error("Error adding product to cart:", error);
    req.flash("error_msg", "An error occurred while adding product to cart");
    res.redirect("back");
  }
});

router.post("/cart/update", async (req, res) => {
  const { productId, userId, quantity } = req.body;

  try {
    let user = await userModel
      .findById(userId)
      .populate("cart.items.productId");
    let item = user.cart.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (item) {
      item.quantity = quantity;
      await user.save();

      let updatedTotal = item.productId.price * item.quantity;
      let updatedGrandTotal = user.cart.items.reduce(
        (acc, curr) => acc + curr.productId.price * curr.quantity,
        0
      );
      let updatedTotalQuantity = user.cart.items.reduce(
        (acc, curr) => acc + curr.quantity,
        0
      );

      res.json({
        success: true,
        updatedTotal,
        updatedGrandTotal,
        updatedTotalQuantity,
      });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false });
  }
});

// Route to view user's orders
router.get("/orders/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    // Validate limit to prevent unreasonable values
    if (limit < 1 || limit > 50) {
      limit = 10; // Set default if limit is out of reasonable range
    }

    const user = await userModel.findById(userId).populate({
      path: "orders",
      populate: {
        path: "items.productId",
        model: "Product",
      },
    });

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user"); // Redirect if user is not found
    }

    // Pagination logic for user's orders
    const totalOrders = user.orders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const ordersOnPage = user.orders.slice(startIndex, endIndex);

    res.render("user/orders", {
      user,
      orders: ordersOnPage,
      path: "/orders",
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit,
      totalOrders,
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to fetch user orders: " + err.message);
    res.redirect("/user"); // Handle error and redirect appropriately
  }
});

// Checkout route
router.post("/checkout/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await userModel
      .findById(userId)
      .populate("cart.items.productId");

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user/cart");
    }

    const cartItems = user.cart.items;

    if (cartItems.length === 0) {
      req.flash("error_msg", "Your cart is empty.");
      return res.redirect("/user/cart");
    }

    let orderTotal = 0;
    const orderItems = [];

    // Decrease stock of products and calculate order total
    for (let item of cartItems) {
      orderTotal += item.productId.price * item.quantity;

      // Decrease stock of products
      item.productId.stock -= item.quantity;
      await item.productId.save();

      // Add item to orderItems array for the order
      orderItems.push({
        productId: item.productId._id,
        quantity: item.quantity,
      });
    }

    // Get the current count from the Count model
    let count = await Count.findOne();
    if (!count) {
      count = new Count();
    }

    // Increment global order count
    count.globalOrderCount += 1;

    // Get user-specific order count
    const userOrderCount = user.orders.length + 1;

    // Create a new order document
    const newOrder = new orderModel({
      user: userId,
      items: orderItems,
      total: orderTotal,
      userOrderId: userOrderCount,
      globalOrderId: count.globalOrderCount,
    });

    // Save the new order to MongoDB
    await newOrder.save();

    // Add order reference to user's orders array
    user.orders.push(newOrder._id);

    // Add order amount to user balance
    user.balance += orderTotal;

    // Clear cart after checkout
    user.cart.items = [];

    // Save user document with updated orders, balance, and cart
    await user.save();

    // Save the updated count to MongoDB
    await count.save();

    req.flash("success_msg", "Order placed successfully!");
    res.redirect(`/user/orders/${userId}`);
  } catch (err) {
    console.error("Error during checkout:", err);
    req.flash("error_msg", "Failed to place order. Please try again.");
    res.redirect("/user/cart");
  }
});

// Route for users to view and make payments
router.get("/payment/:id", async (req, res) => {
  try {
    const path = "/payment";
    const userId = req.params.id;
    const user = await userModel.findById(userId);
    const payments = await paymentModel.find({ user: userId });

    const formatDate = (date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      let day = date.getDate().toString().padStart(2, "0");
      let month = months[date.getMonth()];
      let year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    res.render("user/payment", { user, payments, formatDate, path });
  } catch (err) {
    req.flash("error_msg", "Failed to load payments: " + err.message);
    res.redirect("/");
  }
});

router.post("/payment/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const amountStr = req.body.amount.replace(/,/g, ""); // Remove commas from the amount string
    const amount = parseInt(amountStr, 10); // Parse the cleaned string to an integer

    if (isNaN(amount) || amount <= 0) {
      req.flash("error_msg", "Invalid payment amount");
      return res.redirect(`/user/payment/${userId}`);
    }

    const user = await userModel.findById(userId);

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user");
    }

    // Generate user-specific payment ID
    const userPaymentCount = await paymentModel.countDocuments({
      user: userId,
    });

    const newPayment = new paymentModel({
      user: userId,
      amount,
      status: "Pending",
      userPaymentId: userPaymentCount + 1,
      globalPaymentId: (await paymentModel.countDocuments()) + 1, // Assuming globalPaymentId is the count of all payments
    });

    await newPayment.save();
    req.flash("success_msg", "Payment submitted for approval");
    res.redirect(`/user/payment/${userId}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to process payment: " + err.message);
    res.redirect(`/user/payment/${req.params.id}`);
  }
});

// Route for user profile
router.get("/profile", isLoggedIn, async (req, res) => {
  let path = "/profile";
  try {
    const user = await userModel.findById(req.user._id);

    // Fetch limited recent orders
    const recentOrders = await orderModel
      .find({ user: req.user._id })
      .sort({ orderDate: -1 })
      .limit(2);

    // Fetch limited recent payments
    const recentPayments = await paymentModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(2);

    // Helper function to format dates
    function formatDate(date) {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString("en-US", options);
    }

    res.render("user/profile", { user, recentOrders, recentPayments, path , formatDate });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
