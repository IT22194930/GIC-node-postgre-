const User = require('../../models/User/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UserController {

   static async register(req, res) {
      try {
        const { name, email, password, role = 'user' } = req.body;
        
        // Check if user already exists
        const checkQuery = `SELECT * FROM users WHERE email = $1`;
        const existingUser = await User.query(checkQuery, [email]);
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Email already exists' });
        }
  
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        // Insert new user with created_at timestamp
        const insertQuery = `
          INSERT INTO users (name, email, password, role, created_at) 
          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
          RETURNING id, name, email, role, created_at
        `;
        const result = await User.query(insertQuery, [name, email, hashedPassword, role]);
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: result.rows[0].id,
            role: result.rows[0].role
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
  
        res.status(201).json({
          message: 'User registered successfully',
          user: {
            id: result.rows[0].id,
            name: result.rows[0].name,
            email: result.rows[0].email,
            role: result.rows[0].role,
            created_at: result.rows[0].created_at
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
          { 
            id: user.id,
            role: user.role
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
  
        res.json({
          message: 'Login successful',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        });
      } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
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
      const selectQuery = `SELECT id, name, email, role FROM users WHERE id = $1`;
      const result = await User.query(selectQuery, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
  }

  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role } = req.body;

      // Check if email is being updated and if it already exists
      if (email) {
        const checkQuery = `SELECT id FROM users WHERE email = $1 AND id != $2`;
        const existingUser = await User.query(checkQuery, [email, id]);
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      const updateQuery = `
        UPDATE users 
        SET name = $1,
            email = $2,
            role = $3
        WHERE id = $4 
        RETURNING id, name, email, role, created_at
      `;

      const result = await User.query(updateQuery, [name, email, role, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Error updating user', error: err.message });
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

  static async getUserProfile(req, res) {
    try {
      const query = `SELECT id, name, email, role FROM users WHERE id = $1`;
      const result = await User.query(query, [req.user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching user profile', error: err.message });
    }
  }

  static async updateUserProfile(req, res) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;

      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      // Check if email is being updated and if it already exists
      if (email) {
        const checkQuery = `SELECT id FROM users WHERE email = $1 AND id != $2`;
        const existingUser = await User.query(checkQuery, [email, userId]);
        
        if (existingUser.rows.length > 0) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      // Update user profile
      const updateQuery = `
        UPDATE users 
        SET name = $1,
            email = $2
        WHERE id = $3 
        RETURNING id, name, email, role, created_at
      `;

      const result = await User.query(updateQuery, [name || null, email || null, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error('Error updating profile:', err);
      res.status(500).json({ message: 'Error updating profile', error: err.message });
    }
  }
}

module.exports = UserController;
