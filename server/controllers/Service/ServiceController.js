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

  /**
   * Get all services for the current user
   */
  static async getUserServices(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          s.*,
          o.institution_name as organization_name,
          o.id as organization_id,
          o.status as status
        FROM services s
        JOIN organizations o ON s.organization_id = o.id
        WHERE o.user_id = $1
        ORDER BY s.created_at DESC
      `;

      const result = await ServiceController.query(query, [userId]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching user services:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching services',
        error: error.message
      });
    }
  }

  /**
   * Create a new service for an organization
   */
  static async createService(req, res) {
    try {
      const { organizationId } = req.params;
      const userId = req.user.id; // Get the submitter's user ID
      const { serviceName, category, description, requirements } = req.body;

      // Check if organization exists and is approved
      const checkOrgQuery = 'SELECT * FROM organizations WHERE id = $1';
      const checkOrgResult = await ServiceController.query(checkOrgQuery, [organizationId]);

      if (checkOrgResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }
      
      // Check if organization is approved
      const organization = checkOrgResult.rows[0];
      if (organization.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Services can only be added to approved organizations'
        });
      }

      // Store in services_for_review table instead of services table
      const serviceQuery = `
        INSERT INTO services_for_review (
          organization_id,
          submitter_id,
          service_name,
          category,
          description,
          requirements,
          status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;

      const result = await ServiceController.query(
        serviceQuery, 
        [organizationId, userId, serviceName, category, description, requirements, 'pending']
      );

      res.status(201).json({
        success: true,
        message: 'Service submitted for review successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error submitting service for review:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting service for review',
        error: error.message
      });
    }
  }

  /**
   * Get all services for an organization
   */
  static async getOrganizationServices(req, res) {
    try {
      const { organizationId } = req.params;

      const query = `
        SELECT * FROM services
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `;

      const result = await ServiceController.query(query, [organizationId]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching organization services:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching services',
        error: error.message
      });
    }
  }

  /**
   * Get a service by ID
   */
  static async getServiceById(req, res) {
    try {
      const { serviceId } = req.params;

      const query = `
        SELECT 
          s.*,
          o.institution_name as organization_name,
          o.id as organization_id
        FROM services s
        JOIN organizations o ON s.organization_id = o.id
        WHERE s.id = $1
      `;

      const result = await ServiceController.query(query, [serviceId]);

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
      console.error('Error fetching service:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching service',
        error: error.message
      });
    }
  }

  /**
   * Update a service
   */
  static async updateService(req, res) {
    try {
      const { serviceId, organizationId } = req.params;
      const userId = req.user.id;
      const { serviceName, category, description, requirements } = req.body;

      // Check if organization exists and belongs to the user
      const checkOrgQuery = 'SELECT * FROM organizations WHERE id = $1 AND user_id = $2';
      const checkOrgResult = await ServiceController.query(checkOrgQuery, [organizationId, userId]);

      if (checkOrgResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this service'
        });
      }

      // Check if the organization is in pending status
      if (checkOrgResult.rows[0].status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Services can only be updated for organizations with pending status'
        });
      }

      // Update the service
      const updateQuery = `
        UPDATE services
        SET 
          service_name = $1,
          category = $2,
          description = $3,
          requirements = $4,
          updated_at = NOW()
        WHERE id = $5 AND organization_id = $6
        RETURNING *
      `;

      const result = await ServiceController.query(
        updateQuery, 
        [serviceName, category, description, requirements, serviceId, organizationId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating service',
        error: error.message
      });
    }
  }

  /**
   * Delete a service
   */
  static async deleteService(req, res) {
    try {
      const { serviceId, organizationId } = req.params;
      const userId = req.user.id;

      // First check if organization exists and belongs to the user
      const checkOrgQuery = 'SELECT * FROM organizations WHERE id = $1 AND user_id = $2';
      const checkOrgResult = await ServiceController.query(checkOrgQuery, [organizationId, userId]);

      if (checkOrgResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this service'
        });
      }

      // Now delete the service
      const deleteServiceQuery = `
        DELETE FROM services
        WHERE id = $1 AND organization_id = $2
        RETURNING *
      `;
      
      const result = await ServiceController.query(deleteServiceQuery, [serviceId, organizationId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting service',
        error: error.message
      });
    }
  }

  /**
   * Get services pending review (admin only)
   */
  static async getPendingServices(req, res) {
    try {
      const { status } = req.query;
      let statusFilter = 'pending'; // Default to 'pending' if no status provided
      
      // Only allow valid status values
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        statusFilter = status;
      }

      const query = `
        SELECT 
          sfr.*,
          o.institution_name as organization_name,
          u.name as submitter_name,
          u.email as submitter_email,
          r.name as reviewer_name
        FROM services_for_review sfr
        JOIN organizations o ON sfr.organization_id = o.id
        JOIN users u ON sfr.submitter_id = u.id
        LEFT JOIN users r ON sfr.reviewer_id = r.id
        WHERE sfr.status = $1
        ORDER BY sfr.created_at DESC
      `;

      const result = await ServiceController.query(query, [statusFilter]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching services',
        error: error.message
      });
    }
  }

  /**
   * Review a service (approve or reject)
   */
  static async reviewService(req, res) {
    try {
      const { serviceId } = req.params;
      const { status, reviewerComments } = req.body;
      const reviewerId = req.user.id;

      // Validate status
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "approved" or "rejected"'
        });
      }

      // Start a transaction
      await ServiceController.query('BEGIN', []);

      try {
        // Update the service review status
        const updateQuery = `
          UPDATE services_for_review
          SET 
            status = $1,
            reviewer_id = $2,
            reviewer_comments = $3,
            updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `;

        const result = await ServiceController.query(
          updateQuery, 
          [status, reviewerId, reviewerComments || null, serviceId]
        );

        if (result.rows.length === 0) {
          await ServiceController.query('ROLLBACK', []);
          return res.status(404).json({
            success: false,
            message: 'Service not found'
          });
        }

        const reviewedService = result.rows[0];

        // If approved, copy to the actual services table
        if (status === 'approved') {
          const insertServiceQuery = `
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

          await ServiceController.query(
            insertServiceQuery, 
            [
              reviewedService.organization_id,
              reviewedService.service_name,
              reviewedService.category,
              reviewedService.description,
              reviewedService.requirements
            ]
          );
        }

        // Commit the transaction
        await ServiceController.query('COMMIT', []);

        res.status(200).json({
          success: true,
          message: `Service ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
          data: reviewedService
        });
      } catch (error) {
        await ServiceController.query('ROLLBACK', []);
        throw error;
      }
    } catch (error) {
      console.error('Error reviewing service:', error);
      res.status(500).json({
        success: false,
        message: 'Error reviewing service',
        error: error.message
      });
    }
  }

  /**
   * Get services submitted by the current user
   */
  static async getUserSubmittedServices(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT 
          sfr.*,
          o.institution_name as organization_name,
          u.name as reviewer_name
        FROM services_for_review sfr
        JOIN organizations o ON sfr.organization_id = o.id
        LEFT JOIN users u ON sfr.reviewer_id = u.id
        WHERE sfr.submitter_id = $1
        ORDER BY sfr.created_at DESC
      `;

      const result = await ServiceController.query(query, [userId]);

      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching submitted services:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching submitted services',
        error: error.message
      });
    }
  }

  /**
   * Delete a pending service submission
   */
  static async deleteServiceSubmission(req, res) {
    try {
      const { serviceId } = req.params;
      const userId = req.user.id;

      // Check if the service exists and belongs to the user
      const checkServiceQuery = `
        SELECT * FROM services_for_review 
        WHERE id = $1 AND submitter_id = $2 AND status = 'pending'
      `;
      
      const checkResult = await ServiceController.query(checkServiceQuery, [serviceId, userId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this service submission or it is already reviewed'
        });
      }

      // Delete the service submission
      const deleteQuery = `
        DELETE FROM services_for_review
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await ServiceController.query(deleteQuery, [serviceId]);
      
      res.status(200).json({
        success: true,
        message: 'Service submission deleted successfully',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error deleting service submission:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting service submission',
        error: error.message
      });
    }
  }
}

module.exports = ServiceController;