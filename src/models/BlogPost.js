const { query } = require('../config/database');

class BlogPost {
  static async findAll() {
    try {
      const result = await query(
        'SELECT * FROM blog_posts ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  static async findPublished() {
    try {
      const result = await query(
        'SELECT * FROM blog_posts WHERE is_published = true ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching published blog posts:', error);
      throw error;
    }
  }

  static async findBySlug(slug) {
    try {
      const result = await query(
        'SELECT * FROM blog_posts WHERE slug = $1 AND is_published = true',
        [slug]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM blog_posts WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching blog post by id:', error);
      throw error;
    }
  }

  static async incrementViews(id) {
    try {
      await query(
        'UPDATE blog_posts SET views = views + 1 WHERE id = $1',
        [id]
      );
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  }

  static async findByCategory(category) {
    try {
      const result = await query(
        'SELECT * FROM blog_posts WHERE category = $1 AND is_published = true ORDER BY created_at DESC',
        [category]
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching blog posts by category:', error);
      throw error;
    }
  }
}

module.exports = BlogPost;

