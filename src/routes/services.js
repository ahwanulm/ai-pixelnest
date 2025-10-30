const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');

// All services
router.get('/', servicesController.getAllServices);

// Single service
router.get('/:slug', servicesController.getServiceBySlug);

module.exports = router;

