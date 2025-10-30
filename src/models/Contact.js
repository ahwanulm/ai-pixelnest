const { query } = require('../config/database');

class Contact {
  static async create(contactData) {
    try {
      const { name, email, phone, company, message } = contactData;
      const result = await query(
        `INSERT INTO contacts (name, email, phone, company, message, status) 
         VALUES ($1, $2, $3, $4, $5, 'new') 
         RETURNING *`,
        [name, email, phone, company, message]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  static async findAll() {
    try {
      const result = await query(
        'SELECT * FROM contacts ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query(
        'SELECT * FROM contacts WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching contact by id:', error);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const result = await query(
        'UPDATE contacts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating contact status:', error);
      throw error;
    }
  }
}

module.exports = Contact;

