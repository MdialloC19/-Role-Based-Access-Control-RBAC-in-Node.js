const jwt = require("jsonwebtoken");
const User = require("../models/user");
require("dotenv").config();
const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
console.log(JWT_SECRET, JWT_EXPIRES_IN, "middleware authenticateToken.js");

const authenticateToken = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      console.log(req.headers.authorization, "middleware authenticateToken.js");
      const accessToken = req.headers.authorization.split(" ")[1];
      const { userId, exp } = await jwt.verify(accessToken, JWT_SECRET);

      if (exp < Date.now().valueOf() / 1000) {
        return res.status(401).json({
          error: "JWT token has expired, please login to obtain a new one !",
        });
      }
      const user = await User.findById(userId);
      res.locals.loggedInUser = user;
      next();
    } else {
      next();
    }
  } catch (e) {
    next(e);
  }
};

module.exports = authenticateToken;
