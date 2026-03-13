const express = require("express");
const router = express.Router();
const PagesController = require("../controllers/pagesController");
const { optionalAuth } = require("../middleware/auth");

router.get("/", optionalAuth, PagesController.getPages);

module.exports = router;