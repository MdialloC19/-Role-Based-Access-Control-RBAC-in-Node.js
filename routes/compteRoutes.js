const express = require("express");
const Controller = require("../controllers/compteController");
// const allowIfLoggedin = require("../middlewares/allowIfLoggedIn");

const router = express.Router();
const controller = new Controller();

router.post("/verifyOtp", controller.verifyOtp);
// router.post("/signin", controller.signin);

router.post("/verifyIdentity", controller.verifyIdentity);
router.post("/setPassword/", controller.setPassword);
// router.get("/:num_carte", allowIfLoggedin, controller.getCompte);

module.exports = router;
