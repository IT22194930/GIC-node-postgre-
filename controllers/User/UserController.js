const User = require('../../models/User/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  static async register(req, res) {
    try {
      const { name, email, password } = req.body;
      
      // Check if user already exists
      const checkQuery = `SELECT * FROM users WHERE email = $1`;
      const existingUser = await User.query(checkQuery, [email]);
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const insertQuery = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`;
      const result = await User.query(insertQuery, [name, email, hashedPassword]);
      
      // Generate JWT token
      const token = jwt.sign(
        { id: result.rows[0].id },
        process.env.JWT_SECRET,
      //   { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: result.rows[0].id,
          name: result.rows[0].name,
          email: result.rows[0].email
        },
        token
      });
    } catch (err) {
      res.status(500).json({ message: 'Error registering user', error: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const query = `SELECT * FROM users WHERE email = $1`;
      const result = await User.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
      //   { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        token
      });
    } catch (err) {
      res.status(500).json({ message: 'Error logging in', error: err.message });
    }
  }
}

module.exports = UserController;
