const { query } = require('../config/database');

class Testimonial {
  static async findAll() {
    try {
      const result = await query(
        'SELECT * FROM testimonials ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      throw error;
    }
  }

  static async findFeatured() {
    try {
      const result = await query(
        'SELECT * FROM testimonials WHERE is_featured = true ORDER BY created_at DESC LIMIT 6'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching featured testimonials:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM testimonials WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching testimonial by id:', error);
      throw error;
    }
  }
}

module.exports = Testimonial;

