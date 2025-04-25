-- Create services_for_review table
CREATE TABLE IF NOT EXISTS services_for_review (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL,
  submitter_id INTEGER NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  reviewer_id INTEGER,
  reviewer_comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (submitter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add index to improve query performance
CREATE INDEX idx_services_for_review_org_id ON services_for_review (organization_id);
CREATE INDEX idx_services_for_review_submitter_id ON services_for_review (submitter_id);
CREATE INDEX idx_services_for_review_status ON services_for_review (status);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_services_for_review_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER services_for_review_updated_at
BEFORE UPDATE ON services_for_review
FOR EACH ROW
EXECUTE FUNCTION update_services_for_review_updated_at();

-- Sample insert statement (commented out)
/*
INSERT INTO services_for_review (
  organization_id, 
  submitter_id, 
  service_name, 
  category, 
  description, 
  requirements
) VALUES (
  1, -- organization_id
  2, -- submitter_id (user submitting the service)
  'Web Development',
  'IT Services',
  'Professional web development services for government institutions',
  'Requirements document, project brief, and timeline expectations'
);
*/