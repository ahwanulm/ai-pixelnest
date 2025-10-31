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

  // ============ ADMIN METHODS ============

  /**
   * Create a new blog post
   * @param {Object} postData - Blog post data
   * @returns {Promise<Object>} Created blog post
   */
  static async create(postData) {
    try {
      const { title, slug, excerpt, content, author, category, tags, image_url, is_published } = postData;
      
      const result = await query(
        `INSERT INTO blog_posts 
        (title, slug, excerpt, content, author, category, tags, image_url, is_published, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *`,
        [title, slug, excerpt, content, author, category, tags, image_url, is_published || false]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }

  /**
   * Update a blog post by ID
   * @param {number} id - Blog post ID
   * @param {Object} postData - Updated blog post data
   * @returns {Promise<Object>} Updated blog post
   */
  static async update(id, postData) {
    try {
      const { title, slug, excerpt, content, author, category, tags, image_url, is_published } = postData;
      
      const result = await query(
        `UPDATE blog_posts 
        SET title = $1, slug = $2, excerpt = $3, content = $4, author = $5, 
            category = $6, tags = $7, image_url = $8, is_published = $9, updated_at = NOW()
        WHERE id = $10
        RETURNING *`,
        [title, slug, excerpt, content, author, category, tags, image_url, is_published, id]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  }

  /**
   * Delete a blog post by ID
   * @param {number} id - Blog post ID
   * @returns {Promise<boolean>} Success status
   */
  static async delete(id) {
    try {
      await query('DELETE FROM blog_posts WHERE id = $1', [id]);
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  }

  /**
   * Toggle publish status of a blog post
   * @param {number} id - Blog post ID
   * @returns {Promise<Object>} Updated blog post
   */
  static async togglePublish(id) {
    try {
      const result = await query(
        `UPDATE blog_posts 
        SET is_published = NOT is_published, updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error toggling publish status:', error);
      throw error;
    }
  }

  /**
   * Generate a unique slug from title
   * @param {string} title - Blog post title
   * @returns {Promise<string>} Unique slug
   */
  static async generateSlug(title) {
    try {
      // Convert title to slug format
      let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug exists
      let uniqueSlug = slug;
      let counter = 1;
      
      while (true) {
        const result = await query(
          'SELECT id FROM blog_posts WHERE slug = $1',
          [uniqueSlug]
        );
        
        if (result.rows.length === 0) {
          break;
        }
        
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
      
      return uniqueSlug;
    } catch (error) {
      console.error('Error generating slug:', error);
      throw error;
    }
  }

  /**
   * Get all categories with post counts
   * @returns {Promise<Array>} Categories with counts
   */
  static async getCategories() {
    try {
      const result = await query(
        `SELECT category, COUNT(*) as count 
        FROM blog_posts 
        WHERE is_published = true AND category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Search blog posts by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Matching blog posts
   */
  static async search(keyword) {
    try {
      const result = await query(
        `SELECT * FROM blog_posts 
        WHERE (title ILIKE $1 OR content ILIKE $1 OR tags ILIKE $1) 
        AND is_published = true
        ORDER BY created_at DESC`,
        [`%${keyword}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('Error searching blog posts:', error);
      throw error;
    }
  }
}

module.exports = BlogPost;

