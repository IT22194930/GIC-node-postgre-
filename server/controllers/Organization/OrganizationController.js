const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const connection = require('../../config/database');
class OrganizationController {
  static async query(sql, params) {
    try {
      return await connection.query(sql, params);
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM organizations WHERE email = $1';
    const res = await this.query(sql, [email]);
    return res.rows;
  }

  static async findById(id) {
    const sql = 'SELECT * FROM organizations WHERE id = $1';
    const res = await this.query(sql, [id]);
    return res.rows[0];
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
        services,
        isSubmitted = false
      } = req.body;
      const userId = req.user.id;
      const { name, designation, email, contactNumber } = personalDetails || {};

      if (!province || !district || !institutionName || !name || !designation || !email || !contactNumber) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      // 1) Insert organization
      const orgSql = `
        INSERT INTO organizations (
          province, district, institution_name, website_url,
          name, designation, email, contact_number,
          organization_logo, profile_image, status,
          user_id, isSubmitted, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, 'pending',
          $11, $12, NOW(), NOW()
        ) RETURNING *
      `;
      const orgParams = [
        province, district, institutionName, websiteUrl,
        name, designation, email, contactNumber,
        organizationLogo || organizationLogoUrl,
        profileImage || profileImageUrl,
        userId, isSubmitted
      ];
      const orgRes = await OrganizationController.query(orgSql, orgParams);
      const organization = orgRes.rows[0];

      // 2) Insert services
      let parsedServices = [];
      try {
        parsedServices = typeof services === 'string'
          ? JSON.parse(services)
          : (services || []);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid services format' });
      }

      const svcSql = `
        INSERT INTO services (
          organization_id, service_name, category,
          description, requirements, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING *
      `;
      const createdSvcs = await Promise.all(
        parsedServices.map(svc =>
          OrganizationController.query(svcSql, [
            organization.id,
            svc.serviceName,
            svc.category,
            svc.description,
            svc.requirements
          ])
        )
      );
      const savedServices = createdSvcs.map(r => r.rows[0]);

      // 3) Generate DOCX
      const templatePath = path.resolve(__dirname, '../../templates/organization-template.docx');
      const templateBinary = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(templateBinary);
      const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
      doc.render({
        province,
        district,
        institutionName,
        websiteUrl,
        name,
        designation,
        email,
        contactNumber,
        status: organization.status,
        services: savedServices.map(s => ({
          serviceName: s.service_name,
          category: s.category,
          description: s.description,
          requirements: s.requirements
        }))
      });
      const docxBuffer = doc.getZip().generate({ type: 'nodebuffer' });

      // Ensure output dir exists
      const outDir = path.resolve(__dirname, '../../generated-docs');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

      const docxFilename = `organization-${organization.id}.docx`;
      const docxPath = path.join(outDir, docxFilename);
      fs.writeFileSync(docxPath, docxBuffer);

      // 4) Convert DOCX → PDF
      // Allow override via environment var or default Windows path
      const sofficeCmd = process.env.SOFFICE_PATH
        || (process.platform === 'win32'
            ? `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`
            : 'soffice');

      const pdfFilename = `organization-${organization.id}.pdf`;
      await new Promise((resolve, reject) => {
        exec(
          `${sofficeCmd} --headless --convert-to pdf "${docxPath}" --outdir "${outDir}"`,
          (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });

      const pdfPath = `/generated-docs/${pdfFilename}`;

      // 5) Cleanup DOCX
      fs.unlinkSync(docxPath);

      // 6) Return PDF link
      return res.status(201).json({
        success: true,
        message: 'Organization created and PDF generated successfully',
        data: {
          organization,
          services: savedServices,
          pdfPath
        }
      });
    } catch (err) {
      console.error('Full error:', err);
      if (/not recognized as an internal or external command/.test(err.message)) {
        return res.status(500).json({
          success: false,
          message: 'PDF conversion failed: soffice not found. Install LibreOffice and add it to PATH or set SOFFICE_PATH.',
          error: err.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error creating organization',
        error: err.message
      });
    }
  }

  static async updateOrganizationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
      const sql = `
        UPDATE organizations 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2 
        RETURNING *
      `;
      const result = await OrganizationController.query(sql, [status, id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Organization status updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error updating organization status',
        error: error.message
      });
    }
  }

  static async getOrganizations(req, res) {
    try {
      const { status } = req.query;
      let sql = `
        SELECT o.*,
          json_agg(json_build_object(
            'id', s.id,
            'serviceName', s.service_name,
            'category', s.category,
            'description', s.description,
            'requirements', s.requirements
          )) AS services
        FROM organizations o
        LEFT JOIN services s ON o.id = s.organization_id
      `;
      const params = [];
      if (status) {
        sql += ` WHERE o.status = $1`;
        params.push(status);
      }
      sql += ` GROUP BY o.id ORDER BY o.created_at DESC`;
      const result = await OrganizationController.query(sql, params);
      return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching organizations',
        error: error.message
      });
    }
  }

  static async getOrganizationById(req, res) {
    try {
      const { id } = req.params;
      const sql = `
        SELECT o.*,
          json_agg(json_build_object(
            'id', s.id,
            'serviceName', s.service_name,
            'category', s.category,
            'description', s.description,
            'requirements', s.requirements
          )) AS services
        FROM organizations o
        LEFT JOIN services s ON o.id = s.organization_id
        WHERE o.id = $1
        GROUP BY o.id
      `;
      const result = await OrganizationController.query(sql, [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      return res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching organization',
        error: error.message
      });
    }
  }

  static async getUserOrganizations(req, res) {
    try {
      const userId = req.user.id;
      // Ensure user_id column exists
      const colCheck = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'organizations'
          AND column_name = 'user_id'
      `;
      const colRes = await OrganizationController.query(colCheck, []);
      if (colRes.rows.length === 0) {
        await OrganizationController.query(`
          ALTER TABLE organizations
          ADD COLUMN user_id INTEGER REFERENCES users(id)
        `, []);
      }

      const sql = `
        SELECT o.*,
          json_agg(
            CASE WHEN s.id IS NOT NULL THEN
              json_build_object(
                'id', s.id,
                'serviceName', s.service_name,
                'category', s.category,
                'description', s.description,
                'requirements', s.requirements
              )
            END
          ) FILTER (WHERE s.id IS NOT NULL) AS services
        FROM organizations o
        LEFT JOIN services s ON o.id = s.organization_id
        WHERE o.user_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      const result = await OrganizationController.query(sql, [userId]);
      return res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      return res.status(500).json({
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

      const checkSql = 'SELECT * FROM organizations WHERE id = $1';
      const checkRes = await OrganizationController.query(checkSql, [id]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      const org = checkRes.rows[0];
      if (org.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Permission denied' });
      }
      if (org.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending organizations can be updated' });
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
        profileImageUrl,
        documentPdf,
        services,
        isSubmitted
      } = req.body;
      const { name, designation, email, contactNumber } = personalDetails || {};

      if (!province || !district || !institutionName || !name || !designation || !email || !contactNumber) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const updSql = `
        UPDATE organizations SET
          province        = $1,
          district        = $2,
          institution_name= $3,
          website_url     = $4,
          name            = $5,
          designation     = $6,
          email           = $7,
          contact_number  = $8,
          organization_logo = $9,
          profile_image   = $10,
          documentPdf     = $11,
          isSubmitted     = $12,
          updated_at      = NOW()
        WHERE id = $13
        RETURNING *
      `;
      const updParams = [
        province,
        district,
        institutionName,
        websiteUrl,
        name,
        designation,
        email,
        contactNumber,
        organizationLogo || organizationLogoUrl || org.organization_logo,
        profileImage || profileImageUrl || org.profile_image,
        documentPdf !== undefined ? documentPdf : org.documentPdf,
        isSubmitted !== undefined ? isSubmitted : org.isSubmitted,
        id
      ];
      const updRes = await OrganizationController.query(updSql, updParams);
      const updatedOrg = updRes.rows[0];

      // Replace services
      let parsedSvcs = [];
      try {
        parsedSvcs = typeof services === 'string' ? JSON.parse(services) : (services || []);
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid services format' });
      }
      await OrganizationController.query('DELETE FROM services WHERE organization_id = $1', [id]);
      const newSvcs = await Promise.all(
        parsedSvcs.map(s =>
          OrganizationController.query(svcSql, [
            id, s.serviceName, s.category, s.description, s.requirements
          ])
        )
      );
      const savedNewSvcs = newSvcs.map(r => r.rows[0]);

      return res.status(200).json({
        success: true,
        message: 'Organization updated successfully',
        data: { organization: updatedOrg, services: savedNewSvcs }
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating organization',
        error: error.message
      });
    }
  }

  static async deleteOrganization(req, res) {
    try {
      const { id } = req.params;
      await OrganizationController.query('DELETE FROM services WHERE organization_id = $1', [id]);
      const delRes = await OrganizationController.query(
        'DELETE FROM organizations WHERE id = $1 RETURNING *',
        [id]
      );
      if (delRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Organization not found' });
      }
      return res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
        data: delRes.rows[0]
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting organization',
        error: error.message
      });
    }
  }
}

module.exports = OrganizationController;
