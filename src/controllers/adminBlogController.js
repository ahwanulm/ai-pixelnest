const BlogPost = require('../models/BlogPost');
const groqService = require('../services/groqService');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/blog');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// ============ VIEW CONTROLLERS ============

/**
 * Get admin blog management page
 */
exports.getBlogManagementPage = async (req, res) => {
  try {
    const posts = await BlogPost.findAll();
    const categories = await BlogPost.getCategories();
    
    res.render('admin/blog-management', {
      title: 'Blog Management',
      posts,
      categories,
      success: req.query.success,
      error: req.query.error,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Error loading blog management page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load blog management page',
      error
    });
  }
};

/**
 * Get AI blog generator page
 */
exports.getAIGeneratorPage = async (req, res) => {
  try {
    // Check if Groq API is configured
    const isGroqAvailable = await groqService.isAvailable();
    
    res.render('admin/blog-generator', {
      title: 'AI Blog Generator',
      isGroqAvailable,
      editPost: null,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Error loading AI generator page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load AI generator page',
      error
    });
  }
};

/**
 * Get blog post edit page
 */
exports.getEditPage = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await BlogPost.findById(postId);
    
    if (!post) {
      return res.status(404).render('404', {
        title: 'Post Not Found',
        message: 'The blog post you are looking for does not exist.'
      });
    }

    const isGroqAvailable = await groqService.isAvailable();
    
    res.render('admin/blog-generator', {
      title: 'Edit Blog Post',
      isGroqAvailable,
      editPost: post,
      currentPath: req.path
    });
  } catch (error) {
    console.error('Error loading edit page:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load edit page',
      error
    });
  }
};

// ============ API CONTROLLERS ============

/**
 * Generate blog article using AI
 */
exports.generateArticle = async (req, res) => {
  try {
    const { topic, keywords, category, tone, wordCount } = req.body;

    // Validate input
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Topic is required'
      });
    }

    // Check if Groq is available
    const isAvailable = await groqService.isAvailable();
    if (!isAvailable) {
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please configure Groq API in Admin → API Configs'
      });
    }

    // Generate article using Groq
    const article = await groqService.generateBlogArticle({
      topic: topic.trim(),
      keywords: keywords ? keywords.trim() : '',
      category: category || 'Technology',
      tone: tone || 'professional',
      wordCount: parseInt(wordCount) || 1500
    });

    // Generate slug from title
    const slug = await BlogPost.generateSlug(article.title);

    res.json({
      success: true,
      article: {
        ...article,
        slug,
        author: req.user.name || req.user.email,
        category: category || 'Technology'
      }
    });

  } catch (error) {
    console.error('Error generating article:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate article. Please try again.'
    });
  }
};

/**
 * Create new blog post
 */
exports.createPost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, author, category, tags, image_url, is_published } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = await BlogPost.generateSlug(title);
    }

    // Create post
    const post = await BlogPost.create({
      title,
      slug: finalSlug,
      excerpt: excerpt || '',
      content,
      author: author || req.user.name || req.user.email,
      category: category || 'Uncategorized',
      tags: tags || '',
      image_url: image_url || '',
      is_published: is_published === 'true' || is_published === true
    });

    res.json({
      success: true,
      message: 'Blog post created successfully',
      post
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create blog post'
    });
  }
};

/**
 * Update existing blog post
 */
exports.updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, slug, excerpt, content, author, category, tags, image_url, is_published } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    // Update post
    const post = await BlogPost.update(postId, {
      title,
      slug: slug || await BlogPost.generateSlug(title),
      excerpt: excerpt || '',
      content,
      author: author || req.user.name || req.user.email,
      category: category || 'Uncategorized',
      tags: tags || '',
      image_url: image_url || '',
      is_published: is_published === 'true' || is_published === true
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog post updated successfully',
      post
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blog post'
    });
  }
};

/**
 * Delete blog post
 */
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await BlogPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await BlogPost.delete(postId);

    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete blog post'
    });
  }
};

/**
 * Toggle publish status
 */
exports.togglePublish = async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await BlogPost.togglePublish(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      message: `Blog post ${post.is_published ? 'published' : 'unpublished'} successfully`,
      post
    });

  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle publish status'
    });
  }
};

/**
 * Upload blog image
 */
exports.uploadImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const imageUrl = `/uploads/blog/${req.file.filename}`;

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to upload image'
      });
    }
  }
];

/**
 * Get all blog posts (API)
 */
exports.getAllPosts = async (req, res) => {
  try {
    const posts = await BlogPost.findAll();
    res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog posts'
    });
  }
};

/**
 * Get single blog post (API)
 */
exports.getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await BlogPost.findById(postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog post'
    });
  }
};

module.exports = exports;

