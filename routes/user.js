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
    const userId = req.params.id;
    const path = "/cart";

    // Fetch user and populate cart items with product details
    const user = await userModel
      .findById(userId)
      .populate("cart.items.productId");

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user");
    }

    // Extract cart items and categorize them
    const cartItem = user.cart.items || [];
    const acpProducts = cartItem.filter(
      (product) => product.productId.category === "acp"
    );
    const mixProducts = cartItem.filter(
      (product) => product.productId.category === "mix"
    );

    res.render("user/cart", {
      user,
      cartItem,
      acpProducts,
      mixProducts,
      path,
    });
  } catch (error) {
    console.error("Error fetching cart:", error.message);
    req.flash("error_msg", "An error occurred while fetching the cart");
    res.redirect("/user");
  }
});

router.post("/cart/add", isLoggedIn, async (req, res) => {
  try {
    const { userId, productId, quantity, category } = req.body;

    // Check if all required parameters are provided
    if (!userId || !productId || !quantity || !category) {
      req.flash("error_msg", "Missing required parameters");
      console.log(userId, productId, quantity, category);
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

    // Check if the product category matches with the requested category
    if (product.category !== category) {
      req.flash("error_msg", "Product category does not match");
      return res.redirect("back");
    }

    // Find the cart item
    const cartItem = user.cart.items.find(
      (item) =>
        item.productId.toString() === productId && item.category === category
    );

    if (cartItem) {
      cartItem.quantity += parsedQuantity;
    } else {
      user.cart.items.push({ productId, quantity: parsedQuantity, category });
    }

    // Update the respective balance based on category
    if (category === "ACP") {
      user.balanceACP += product.price * parsedQuantity;
    } else if (category === "Mix") {
      user.balanceMix += product.price * parsedQuantity;
    }

    // Save the user document
    await user.save();

    req.flash("success_msg", "Product added to cart");
    res.redirect("/user/cart/" + userId);
  } catch (error) {
    console.error("Error adding product to cart:", error.message);
    req.flash("error_msg", "An error occurred while adding product to cart");
    res.redirect("back");
  }
});

router.post("/cart/update", async (req, res) => {
  const { productId, userId, quantity, category } = req.body;

  try {
    let user = await userModel
      .findById(userId)
      .populate("cart.items.productId");

    // Filter items by category
    let items = user.cart.items.filter(
      (item) => item.productId.category === category
    );
    let item = items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (item) {
      item.quantity = quantity;
      await user.save();

      // Calculate updated totals for the specific category
      let updatedTotal = item.productId.price * item.quantity;
      let updatedGrandTotal = items.reduce(
        (acc, curr) => acc + curr.productId.price * curr.quantity,
        0
      );
      let updatedTotalQuantity = items.reduce(
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

// POST route to delete item from user's cart
router.post("/cart/delete/:productId/:userId", isLoggedIn, async (req, res) => {
  const productId = req.params.productId;
  const userId = req.params.userId;

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect(`/user/cart/${userId}`);
    }

    // Filter out the item to be deleted from the cart
    user.cart.items = user.cart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    // Save the updated cart
    await user.save();

    req.flash("success_msg", "Item removed from cart successfully");
    return res.redirect(`/user/cart/${userId}`);
  } catch (err) {
    console.error("Error removing item from cart:", err);
    req.flash(
      "error_msg",
      "Failed to remove item from cart. Please try again."
    );
    return res.redirect(`/user/cart/${userId}`);
  }
});

// Route to view user's orders by category
router.get("/orders/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const category = req.query.category; // Get the category from query parameter

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

    // Filter orders by category if category query parameter is provided
    let filteredOrders = user.orders;
    if (category) {
      filteredOrders = filteredOrders.filter(
        (order) => order.category === category
      );
    }

    // Pagination logic for user's orders
    const totalOrders = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const ordersOnPage = filteredOrders.slice(startIndex, endIndex);

    res.render("user/orders", {
      user,
      orders: ordersOnPage.map((order) => ({
        ...order.toObject(),
        category: order.category, // Add category to order object
      })),
      path: "/orders",
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit,
      totalOrders,
      category, // Pass category to template for filtering UI
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
  const category = req.query.category; // Get the category from the query parameter

  try {
    const user = await userModel
      .findById(userId)
      .populate("cart.items.productId");

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect(`/user/cart/${userId}`);
    }

    const cartItems = user.cart.items.filter(
      (item) => item.category === category
    );

    if (cartItems.length === 0) {
      req.flash("error_msg", "Your cart is empty.");
      return res.redirect(`/user/cart/${userId}`);
    }

    let orderTotal = 0;
    const orderItems = [];

    // Decrease stock of products and calculate order total
    for (let item of cartItems) {
      orderTotal += item.productId.price * item.quantity;
      orderItems.push({
        productId: item.productId._id,
        quantity: item.quantity,
      });

      // Decrease stock of products
      item.productId.stock -= item.quantity;
      await item.productId.save();
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

    // Create new order document
    const newOrder = new orderModel({
      user: userId,
      items: orderItems,
      total: orderTotal,
      userOrderId: userOrderCount,
      globalOrderId: count.globalOrderCount,
      category: category, // Save the category of the order
    });

    // Save the new order to MongoDB
    await newOrder.save();

    // Add order reference to user's orders array
    user.orders.push(newOrder._id);

    // Add order amount to the respective balance
    if (category === "acp") {
      user.balanceACP += orderTotal;
    } else if (category === "mix") {
      user.balanceMix += orderTotal;
    }

    // Remove ordered items from the cart
    user.cart.items = user.cart.items.filter(
      (item) => item.category !== category
    );

    // Save user document with updated orders, balances, and cart
    await user.save();

    // Save the updated count to MongoDB
    await count.save();

    req.flash("success_msg", "Order placed successfully!");
    res.redirect(`/user/orders/${userId}`);
  } catch (err) {
    console.error("Error during checkout:", err);
    req.flash(
      "error_msg",
      "Failed to place order. Please try again." + err.message
    );
    res.redirect(`/user/cart/${userId}`);
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
      let year = date.getFullYear().toString().slice(-2); // Get the last two digits of the year
      return `${day}-${month}-${year}`;
    };

    res.render("user/payment", { user, payments, formatDate, path });
  } catch (err) {
    req.flash("error_msg", "Failed to load payments: " + err.message);
    res.redirect("/");
  }
});

// Route for making ACP payments
router.post("/payment/acp/:id", async (req, res) => {
  const userId = req.params.id;
  const amountStr = req.body.amountACP.replace(/,/g, ""); // Remove commas from the amount string
  const amount = parseInt(amountStr, 10); // Parse the cleaned string to an integer

  try {
    if (isNaN(amount) || amount <= 0) {
      req.flash("error_msg", "Invalid payment amount");
      return res.redirect(`/user/payment/${userId}`);
    }

    const user = await userModel.findById(userId);

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user");
    }

    if (amount > user.balanceACP) {
      req.flash("error_msg", "Insufficient balance for ACP payment");
      return res.redirect(`/user/payment/${userId}`);
    }

    // Generate user-specific payment ID for ACP payments
    const userPaymentCountACP = await paymentModel.countDocuments({
      user: userId,
      category: "ACP",
    });

    const newPaymentACP = new paymentModel({
      user: userId,
      amount,
      status: "Pending",
      userPaymentId: userPaymentCountACP + 1,
      globalPaymentId: (await paymentModel.countDocuments()) + 1, // Assuming globalPaymentId is the count of all payments
      category: "ACP", // Set category as ACP
    });

    await newPaymentACP.save();

    // Add payment to user's payments array
    user.payments.push(newPaymentACP);
    await user.save();

    req.flash("success_msg", "ACP Payment submitted for approval");
    res.redirect(`/user/payment/${userId}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to process ACP payment: " + err.message);
    res.redirect(`/user/payment/${userId}`);
  }
});

// Route for making Mix payments
router.post("/payment/mix/:id", async (req, res) => {
  const userId = req.params.id;
  const amountStr = req.body.amountMix.replace(/,/g, ""); // Remove commas from the amount string
  const amount = parseInt(amountStr, 10); // Parse the cleaned string to an integer

  try {
    if (isNaN(amount) || amount <= 0) {
      req.flash("error_msg", "Invalid payment amount");
      return res.redirect(`/user/payment/${userId}`);
    }

    const user = await userModel.findById(userId);

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect("/user");
    }

    if (amount > user.balanceMix) {
      req.flash("error_msg", "Insufficient balance for Mix payment");
      return res.redirect(`/user/payment/${userId}`);
    }

    // Generate user-specific payment ID for Mix payments
    const userPaymentCountMix = await paymentModel.countDocuments({
      user: userId,
      category: "Mix",
    });

    const newPaymentMix = new paymentModel({
      user: userId,
      amount,
      status: "Pending",
      userPaymentId: userPaymentCountMix + 1,
      globalPaymentId: (await paymentModel.countDocuments()) + 1, // Assuming globalPaymentId is the count of all payments
      category: "Mix", // Set category as Mix
    });

    await newPaymentMix.save();

    // Add payment to user's payments array
    user.payments.push(newPaymentMix);
    await user.save();

    req.flash("success_msg", "Mix Payment submitted for approval");
    res.redirect(`/user/payment/${userId}`);
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to process Mix payment: " + err.message);
    res.redirect(`/user/payment/${userId}`);
  }
});

// Route for user profile
router.get("/profile", isLoggedIn, async (req, res) => {
  let path = "/profile";
  try {
    // Function to format date as "YYYY-MM-DD HH:mm:ss"
    function formatDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = ("0" + (d.getMonth() + 1)).slice(-2);
      const day = ("0" + d.getDate()).slice(-2);

      return `${day}-${month}-${year}`;
    }
    const userId = req.user._id;
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

    res.render("user/profile", { user, path, formatDate });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Failed to fetch user details" + err.message);
    res.redirect("/users");
  }
});

module.exports = router;
