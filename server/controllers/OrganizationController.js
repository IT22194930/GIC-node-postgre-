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
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
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
        'pending'
      ];

      const organizationResult = await OrganizationController.query(organizationQuery, organizationParams);
      const organization = organizationResult.rows[0];

      // Create services
      let parsedServices;
      try {
        parsedServices = typeof services === 'string' ? JSON.parse(services) : services;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid services data format'
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

      const createdServices = await Promise.all(
        parsedServices.map(service =>
          OrganizationController.query(serviceQuery, [
            organization.id,
            service.serviceName,
            service.category,
            service.description,
            service.requirements
          ])
        )
      );

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: {
          organization,
          services: createdServices.map(result => result.rows[0])
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
          o.*,
          json_agg(
            json_build_object(
              'id', s.id,
              'serviceName', s.service_name,
              'category', s.category,
              'description', s.description,
              'requirements', s.requirements
            )
          ) as services
        FROM organizations o
        LEFT JOIN services s ON o.id = s.organization_id
      `;

      const params = [];
      if (status) {
        query += ` WHERE o.status = $1`;
        params.push(status);
      }

      query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

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
          o.*,
          json_agg(
            json_build_object(
              'id', s.id,
              'serviceName', s.service_name,
              'category', s.category,
              'description', s.description,
              'requirements', s.requirements
            )
          ) as services
        FROM organizations o
        LEFT JOIN services s ON o.id = s.organization_id
        WHERE o.id = $1
        GROUP BY o.id
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
}

module.exports = OrganizationController; 