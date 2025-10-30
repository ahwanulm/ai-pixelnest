const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

// Pricing page
router.get('/', pricingController.getPricingPage);

module.exports = router;

