const isLoggedIn = require("../middlewares/isLoggedIn");
const userModel = require("../models/user");
const productModel = require("../models/product");
const paymentModel = require("../models/payment");
const orderModel = require("../models/order");
const router = require("express").Router();
const Count = require("../models/count");

router.get("/", isLoggedIn, async (req, res) => {
  try {
    const path = "/users";
    const search = req.query.search || "";
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const selectedBrand = req.query.brand || "all";
    const selectedCategory = req.query.category || "all";

    // Fetch distinct brands and categories
    const brands = await productModel.distinct("brand");
    const categories = await productModel.distinct("category");

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (selectedBrand !== "all") {
      query.brand = selectedBrand;
    }
    if (selectedCategory !== "all") {
      query.category = selectedCategory;
    }

    const products = await productModel
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit);
    const totalProducts = await productModel.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    res.render("user/home", {
      user: req.user, // Assuming user information is stored in req.user
      products,
      brands,
      categories,
      search,
      selectedBrand,
      selectedCategory,
      currentPage: page,
      totalPages,
      limit,
      path,
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).send("Internal Server Error");
  }
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
      (product) => product.productId.brand === "Acp"
    );
    const mixProducts = cartItem.filter(
      (product) => product.productId.brand === "Mix"
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
    const { userId, productId, quantity, category, brand } = req.body;

    // Check if all required parameters are provided
    if (!userId || !productId || !quantity || !category || !brand) {
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

    // Check if the product category matches with the requested category
    if (product.category !== category) {
      req.flash("error_msg", "Product category does not match");
      return res.redirect("back");
    }

    // Check if the product brand matches with the requested brand
    if (product.brand !== brand) {
      req.flash("error_msg", "Product brand does not match" + product.brand);
      return res.redirect("back");
    }

    // Find the cart item
    const cartItem = user.cart.items.find(
      (item) => item.productId.toString() === productId && item.brand === brand
    );

    if (cartItem) {
      cartItem.quantity += parsedQuantity;
    } else {
      user.cart.items.push({ productId, quantity: parsedQuantity, brand });
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

// Update quantity in user's cart
router.post("/cart/update", async (req, res) => {
  const { productId, userId, quantity, brand } = req.body;

  try {
    let user = await userModel.findById(userId);

    // Find the item in the cart by productId and brand
    let itemIndex = user.cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.brand === brand
    );

    if (itemIndex !== -1) {
      // Update quantity if item exists
      user.cart.items[itemIndex].quantity = quantity;
      await user.save();

      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Item not found in cart." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
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

// Route to view user's orders by category with pagination and limit
router.get("/orders/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    const brand = req.query.brand; // Get the brand from query parameter

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

    // Filter orders by brand if brand query parameter is provided
    let filteredOrders = user.orders;
    if (brand) {
      filteredOrders = filteredOrders.filter(
        (order) => order.brand.toLowerCase() === brand.toLowerCase()
      );
    }

    // Sort filtered orders by status: Pending -> Approved -> Rejected
    filteredOrders.sort((a, b) => {
      const statusOrder = { Pending: 1, Approved: 2, Rejected: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    });

    // Pagination logic for user's orders
    const totalOrders = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const ordersOnPage = filteredOrders.slice(startIndex, endIndex);

    res.render("user/orders", {
      user,
      orders: ordersOnPage.map((order) => ({
        ...order.toObject(),
        brand: order.brand, // Add brand to order object
      })),
      path: "/orders",
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      limit,
      totalOrders,
      brand, // Pass brand to template for filtering UI
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
  const brand = req.query.brand; // Get the category from the query parameter

  try {
    const user = await userModel
      .findById(userId)
      .populate("cart.items.productId");

    if (!user) {
      req.flash("error_msg", "User not found");
      return res.redirect(`/user/cart/${userId}`);
    }

    const cartItems = user.cart.items.filter((item) => item.brand === brand);

    if (cartItems.length === 0) {
      req.flash("error_msg", "Your cart is empty.");
      return res.redirect(`/user/cart/${userId}`);
    }

    let orderTotal = 0;
    const orderItems = [];

    // Decrease stock of products and calculate order total
    for (let item of cartItems) {
      orderItems.push({
        productId: item.productId._id,
        quantity: item.quantity,
      });
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
      userOrderId: userOrderCount,
      globalOrderId: count.globalOrderCount,
      brand, // Save the category of the order
    });

    // Save the new order to MongoDB
    await newOrder.save();

    // Add order reference to user's orders array
    user.orders.push(newOrder._id);

    // Remove ordered items from the cart
    user.cart.items = user.cart.items.filter((item) => item.brand !== brand);

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
      brand: "Acp",
    });

    const newPaymentACP = new paymentModel({
      user: userId,
      amount,
      status: "Pending",
      userPaymentId: userPaymentCountACP + 1,
      globalPaymentId: (await paymentModel.countDocuments()) + 1, // Assuming globalPaymentId is the count of all payments
      brand: "Acp", // Set Brand as ACP
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
      brand: "Mix",
    });

    const newPaymentMix = new paymentModel({
      user: userId,
      amount,
      status: "Pending",
      userPaymentId: userPaymentCountMix + 1,
      globalPaymentId: (await paymentModel.countDocuments()) + 1, // Assuming globalPaymentId is the count of all payments
      brand: "Mix", // Set category as Mix
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
