const express = require("express");
// import middleware from "../middlewares/auth.middleware.js";
const user = require("../controllers/userController.js");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to the authentication." });
});

/**
 * @desc Route to register user
 * @route POST api/users
 * @access Private available for Admin
 */
router.post(
  "/register" /*, middleware.validateRegister*/,
  user.userRegisterUser
);

/**
 * @desc Route to log a user
 * @route POST api/users
 * @access Private available for Admin
 */
router.post("/login" /*, middleware.validateLogin*/, user.userLoginUser);

module.exports = router;
