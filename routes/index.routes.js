const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoutes");
const compteRoutes = require("./compteRoutes");
router.use("/user", userRoutes);
router.use("/compte", compteRoutes);
module.exports = router;
