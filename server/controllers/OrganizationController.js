const connection = require('../config/database');

class OrganizationController {
  static async query(query, params) {
    try {
      const result = await connection.query(query, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM organizations WHERE email = $1';
    const result = await this.query(query, [email]);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM organizations WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rows[0];
  }

  static async createOrganization(req, res) {
    try {
      const {
        province,
        district,
        institutionName,
        websiteUrl,
        personalDetails,
        organizationLogo,
        organizationLogoUrl,
        profileImage,
        profileImageUrl,
        services
      } = req.body;

      // Get user ID from authentication middleware
      const userId = req.user.id;

      // Get personal details directly from the object
      const { name, designation, email, contactNumber } = personalDetails;

      // Validate required fields
      if (!province || !district || !institutionName || !name || !designation || !email || !contactNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Create organization
      const organizationQuery = `
        INSERT INTO organizations (
          province,
          district,
          institution_name,
          website_url,
          name,
          designation,
          email,
          contact_number,
          organization_logo,
          profile_image,
          status,
          user_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;

      const organizationParams = [
        province,
        district,
        institutionName,
        websiteUrl,
        name,
        designation,
        email,
        contactNumber,
        organizationLogo || organizationLogoUrl,
        profileImage || profileImageUrl,
        'pending',
        userId // Add user ID to parameters
      ];

      const organizationResult = await OrganizationController.query(organizationQuery, organizationParams);
      const organization = organizationResult.rows[0];

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: {
          organization
        }
      });
    } catch (error) {
      console.error('Full error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating organization',
        error: error.message
      });
    }
  }

  static async updateOrganizationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      const query = `
        UPDATE organizations 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `;

      const result = await OrganizationController.query(query, [status, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Organization status updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating organization status',
        error: error.message
      });
    }
  }

  static async getOrganizations(req, res) {
    try {
      const { status } = req.query;
      let query = `
        SELECT 
          o.*
        FROM organizations o
      `;

      const params = [];
      if (status) {
        query += ` WHERE o.status = $1`;
        params.push(status);
      }

      query += ` ORDER BY o.created_at DESC`;

      const result = await OrganizationController.query(query, params);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching organizations',
        error: error.message
      });
    }
  }

  static async getOrganizationById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          o.*
        FROM organizations o
        WHERE o.id = $1
      `;

      const result = await OrganizationController.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching organization',
        error: error.message
      });
    }
  }

  static async getUserOrganizations(req, res) {
    try {
      const userId = req.user.id; // Get user ID from authentication middleware

      // Check if the user_id column exists in the organizations table
      try {
        const checkColumnQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'organizations' 
          AND column_name = 'user_id';
        `;
        const checkResult = await OrganizationController.query(checkColumnQuery, []);
        
        if (checkResult.rows.length === 0) {
          // Add user_id column if it doesn't exist
          const addColumnQuery = `
            ALTER TABLE organizations
            ADD COLUMN user_id INTEGER REFERENCES users(id);
          `;
          await OrganizationController.query(addColumnQuery, []);
          console.log('Added user_id column to organizations table');
        }
      } catch (err) {
        console.error('Error checking/adding user_id column:', err);
      }

      // Now proceed with the original query
      const query = `
        SELECT 
          o.*
        FROM organizations o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
      `;

      const result = await OrganizationController.query(query, [userId]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching organizations',
        error: error.message
      });
    }
  }

  static async updateOrganization(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // First check if organization exists and belongs to the user
      const checkQuery = 'SELECT * FROM organizations WHERE id = $1';
      const checkResult = await OrganizationController.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      const organization = checkResult.rows[0];

      // Check if the organization belongs to the user
      if (organization.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this organization'
        });
      }

      // Check if the organization is in pending status
      if (organization.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Only organizations with pending status can be updated'
        });
      }

      const {
        province,
        district,
        institutionName,
        websiteUrl,
        personalDetails,
        organizationLogo,
        organizationLogoUrl,
        profileImage,
        profileImageUrl
      } = req.body;

      // Get personal details directly from the object
      const { name, designation, email, contactNumber } = personalDetails;

      // Validate required fields
      if (!province || !district || !institutionName || !name || !designation || !email || !contactNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Update organization
      const updateQuery = `
        UPDATE organizations SET
          province = $1,
          district = $2,
          institution_name = $3,
          website_url = $4,
          name = $5,
          designation = $6,
          email = $7,
          contact_number = $8,
          organization_logo = $9,
          profile_image = $10,
          updated_at = NOW()
        WHERE id = $11
        RETURNING *
      `;

      const updateParams = [
        province,
        district,
        institutionName,
        websiteUrl,
        name,
        designation,
        email,
        contactNumber,
        organizationLogo || organizationLogoUrl || organization.organization_logo,
        profileImage || profileImageUrl || organization.profile_image,
        id
      ];

      const updateResult = await OrganizationController.query(updateQuery, updateParams);
      const updatedOrg = updateResult.rows[0];

      res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: {
          organization: updatedOrg
        }
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating organization',
        error: error.message
      });
    }
  }

  static async deleteOrganization(req, res) {
    try {
      const { id } = req.params;

      // Then delete the organization
      const deleteOrgQuery = `
        DELETE FROM organizations
        WHERE id = $1
        RETURNING *
      `;
      const result = await OrganizationController.query(deleteOrgQuery, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting organization',
        error: error.message
      });
    }
  }
}

module.exports = OrganizationController;