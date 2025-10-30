const { query } = require('../config/database');

class Service {
  static async findAll() {
    try {
      const result = await query(
        'SELECT * FROM services WHERE is_active = true ORDER BY id ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  static async findBySlug(slug) {
    try {
      const result = await query(
        'SELECT * FROM services WHERE slug = $1 AND is_active = true',
        [slug]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching service by slug:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM services WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching service by id:', error);
      throw error;
    }
  }
}

module.exports = Service;

