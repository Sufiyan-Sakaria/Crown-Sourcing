const bcrypt = require("bcrypt");

// Function to hash the password (async function)
const hashPassword = async (password) => {
  try {
    // Generate a salt to hash the password
    const salt = await bcrypt.genSalt(10);

    // Hash the password using the generated salt
    const hash = await bcrypt.hash(password, salt);

    // Return the hashed password
    return hash;
  } catch (error) {
    throw new Error("Error hashing password: " + error.message);
  }
};

// Function to verify the password (async function)
const verifyPassword = async (password, hashedPassword) => {
  try {
    // Compare the provided password with the hashed password
    const result = await bcrypt.compare(password, hashedPassword);

    // Return true if passwords match, false otherwise
    return result;
  } catch (error) {
    throw new Error("Error verifying password: " + error.message);
  }
};

module.exports = { hashPassword, verifyPassword };