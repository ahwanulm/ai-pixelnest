const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');

// All blog posts
router.get('/', blogController.getAllPosts);

// Single blog post
router.get('/:slug', blogController.getPostBySlug);

module.exports = router;

