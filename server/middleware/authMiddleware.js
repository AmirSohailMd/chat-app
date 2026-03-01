const jwt = require("jsonwebtoken");
const User = require("../models/User");

//console.log("JWT_SECRET:", process.env.JWT_SECRET);
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //console.log("FULL HEADER:", req.headers.authorization);
      //console.log(token);
      //console.log("Verifying with:", process.env.JWT_SECRET);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
      console.log("JWT ERROR:", error.message);
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };
