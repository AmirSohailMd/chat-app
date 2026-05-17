const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
// @route   POST /api/users/register
// @desc    Register new user
// @access  Public

//User registration
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // validation: ensure all fields are present
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide all the fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    const normalizedEmail = email.toLowerCase();

    // check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    if (!user) {
      return res.status(500).json({ message: "User creation failed" });
    }

    //response
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/users/login
// @desc    Authenticate user
// @access  Public

//User login
const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Provide all the fields" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
