const bcrypt = require("bcrypt");

const hashPassword = (password , res) => {
  try {
    // Generate a salt to hash the password
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.send(err.message);
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) return res.send(err.message);
        return hash;
      });
    });
  } catch (error) {
    throw new Error("Error hashing password: " + error.message);
  }
};

// Function to verify the password (async function)
const verifyPassword = async (password, user) => {
  try {
    // Compare the provided password with the hashed password
    const result = await bcrypt.compare(password, user.password);

    // Return true if passwords match, false otherwise
    return result;
  } catch (error) {
    throw new Error("Error verifying password: " + error.message);
  }
};

module.exports = { hashPassword, verifyPassword };
