const connection = require('../../config/database');

class User {
  static async query(query, params) {
    try {
      const result = await connection.query(query, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}

module.exports = User;
