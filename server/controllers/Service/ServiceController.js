const connection = require('../../config/database');

class ServiceController {
  static async query(query, params) {
    try {
      const result = await connection.query(query, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  static async getAllServices(req, res) {
    try {
      const query = `
        SELECT 
          s.*,
          o.institution_name as organization_name,
          o.province,
          o.district
        FROM services s
        JOIN organizations o ON s.organization_id = o.id
        ORDER BY s.created_at DESC
      `;
      
      const result = await ServiceController.query(query, []);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching services',
        error: error.message
      });
    }
  }

  static async getServiceById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          s.*,
          o.institution_name as organization_name,
          o.province,
          o.district,
          o.email as organization_email,
          o.contact_number as organization_contact
        FROM services s
        JOIN organizations o ON s.organization_id = o.id
        WHERE s.id = $1
      `;

      const result = await ServiceController.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching service',
        error: error.message
      });
    }
  }

  static async createService(req, res) {
    try {
      const { 
        organization_id, 
        serviceName, 
        category, 
        description, 
        requirements 
      } = req.body;

      // Validate required fields
      if (!organization_id || !serviceName || !category || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if organization exists
      const orgQuery = 'SELECT * FROM organizations WHERE id = $1';
      const orgResult = await ServiceController.query(orgQuery, [organization_id]);
      
      if (orgResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      const serviceQuery = `
        INSERT INTO services (
          organization_id,
          service_name,
          category,
          description,
          requirements,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;

      const serviceParams = [
        organization_id,
        serviceName,
        category,
        description,
        requirements || ''
      ];

      const result = await ServiceController.query(serviceQuery, serviceParams);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating service',
        error: error.message
      });
    }
  }

  static async updateService(req, res) {
    try {
      const { id } = req.params;
      const { 
        serviceName, 
        category, 
        description, 
        requirements 
      } = req.body;

      // Validate required fields
      if (!serviceName || !category || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Check if service exists
      const checkQuery = 'SELECT * FROM services WHERE id = $1';
      const checkResult = await ServiceController.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Get the organization id from the service
      const service = checkResult.rows[0];
      
      // Check if user has permission (this depends on your auth setup)
      // You can implement permission checks here

      const updateQuery = `
        UPDATE services SET
          service_name = $1,
          category = $2,
          description = $3,
          requirements = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;

      const updateParams = [
        serviceName,
        category,
        description,
        requirements || service.requirements || '',
        id
      ];

      const result = await ServiceController.query(updateQuery, updateParams);

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating service',
        error: error.message
      });
    }
  }

  static async deleteService(req, res) {
    try {
      const { id } = req.params;

      // Check if service exists
      const checkQuery = 'SELECT * FROM services WHERE id = $1';
      const checkResult = await ServiceController.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Delete the service
      const deleteQuery = `
        DELETE FROM services
        WHERE id = $1
        RETURNING *
      `;

      const result = await ServiceController.query(deleteQuery, [id]);

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting service',
        error: error.message
      });
    }
  }

  static async getServicesByOrganization(req, res) {
    try {
      const { organization_id } = req.params;

      const query = `
        SELECT * FROM services
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `;

      const result = await ServiceController.query(query, [organization_id]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching services by organization',
        error: error.message
      });
    }
  }

  static async getServicesByCategory(req, res) {
    try {
      const { category } = req.params;

      const query = `
        SELECT 
          s.*,
          o.institution_name as organization_name,
          o.province,
          o.district
        FROM services s
        JOIN organizations o ON s.organization_id = o.id
        WHERE s.category ILIKE $1
        ORDER BY s.created_at DESC
      `;

      const result = await ServiceController.query(query, [`%${category}%`]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching services by category',
        error: error.message
      });
    }
  }

  static async searchServices(req, res) {
    try {
      const { query: searchQuery } = req.query;

      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const query = `
        SELECT 
          s.*,
          o.institution_name as organization_name,
          o.province,
          o.district
        FROM services s
        JOIN organizations o ON s.organization_id = o.id
        WHERE 
          s.service_name ILIKE $1 OR
          s.category ILIKE $1 OR
          s.description ILIKE $1 OR
          o.institution_name ILIKE $1
        ORDER BY s.created_at DESC
      `;

      const result = await ServiceController.query(query, [`%${searchQuery}%`]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error searching services',
        error: error.message
      });
    }
  }
}

module.exports = ServiceController;
