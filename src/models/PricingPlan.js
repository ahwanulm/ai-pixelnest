const { query } = require('../config/database');

class PricingPlan {
  static async findAll() {
    try {
      const result = await query(
        'SELECT * FROM pricing_plans WHERE is_active = true ORDER BY display_order ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM pricing_plans WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching pricing plan by id:', error);
      throw error;
    }
  }

  static async findPopular() {
    try {
      const result = await query(
        'SELECT * FROM pricing_plans WHERE is_popular = true AND is_active = true LIMIT 1'
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching popular pricing plan:', error);
      throw error;
    }
  }
}

module.exports = PricingPlan;

