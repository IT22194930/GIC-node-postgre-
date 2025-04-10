const connection = require('../../config/database');

class User {
  static async query(query, params) {
    return connection.query(query, params);
  }
}

module.exports = User;
