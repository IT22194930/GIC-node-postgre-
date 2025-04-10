const User = require('../../models/User/User');

class UserController {
  static async createUser(req, res) {
    try {
      const { name, age } = req.body;
      const insertQuery = `INSERT INTO users (name, age) VALUES ($1, $2) RETURNING id`;
      const result = await User.query(insertQuery, [name, age]);
      res.send({ message: "Data inserted successfully" });
    } catch (err) {
      res.status(500).send(err);
    }
  }

  static async getAllUsers(req, res) {
    try {
      const selectQuery = `SELECT * FROM users`;
      const result = await User.query(selectQuery);
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err);
    }
  }

  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const selectQuery = `SELECT * FROM users WHERE id = $1`;
      const result = await User.query(selectQuery, [id]);
      res.send(result.rows);
    } catch (err) {
      res.status(500).send(err);
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, age } = req.body;
      const updateQuery = `UPDATE users SET name = $1, age = $2 WHERE id = $3`;
      await User.query(updateQuery, [name, age, id]);
      res.send("Data updated successfully");
    } catch (err) {
      res.status(500).send(err);
    }
  }

  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleteQuery = `DELETE FROM users WHERE id = $1`;
      await User.query(deleteQuery, [id]);
      res.send("User deleted successfully"); 
    } catch (err) {
      res.status(500).send(err);
    }
  }
}

module.exports = UserController;
