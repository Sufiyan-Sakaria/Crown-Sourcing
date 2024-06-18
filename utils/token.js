const jwt = require("jsonwebtoken");
const secret = process.env.JWT_KEY; // Get JWT secret key from environment variables

// Function to generate a JWT token
function generateToken(user) {
  const payload = {
    id: user._id,
    username: user.username,
  };
  return jwt.sign(payload, secret);
}

// Function to verify a JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, secret); // Verify the token using the secret key
  } catch (error) {
    console.error("Token verification error:", error.message); // Log error if token verification fails
    return null;
  }
}

module.exports = { generateToken, verifyToken }; // Export the functions
