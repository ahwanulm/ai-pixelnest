const BlogPost = require('../models/BlogPost');

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await BlogPost.findPublished();
    res.render('blog', {
      title: 'Blog - PixelNest',
      posts: posts || [],
      currentPath: '/blog'
    });
  } catch (error) {
    console.error('Error loading blog posts:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load blog posts'
    });
  }
};

exports.getPostBySlug = async (req, res) => {
  try {
    const post = await BlogPost.findBySlug(req.params.slug);
    
    if (!post) {
      return res.status(404).render('404', {
        title: 'Post Not Found',
        message: 'The blog post you are looking for does not exist.'
      });
    }

    // Increment view count
    await BlogPost.incrementViews(post.id);

    res.render('blog-post', {
      title: `${post.title} - PixelNest Blog`,
      post,
      currentPath: '/blog'
    });
  } catch (error) {
    console.error('Error loading blog post:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Failed to load blog post'
    });
  }
};

