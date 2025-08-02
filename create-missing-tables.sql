-- First, create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE,
  password_hash VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Check if tables exist and create them if missing
DO $$
BEGIN
    -- Check if companies table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'companies') THEN
        CREATE TABLE companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR NOT NULL,
          industry VARCHAR,
          size VARCHAR,
          website VARCHAR,
          phone VARCHAR,
          email VARCHAR,
          address JSONB,
          notes TEXT,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_companies_name ON companies(name);
    END IF;

    -- Check if contacts table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contacts') THEN
        CREATE TABLE contacts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          first_name VARCHAR NOT NULL,
          last_name VARCHAR NOT NULL,
          email VARCHAR,
          phone VARCHAR,
          position VARCHAR,
          department VARCHAR,
          is_primary BOOLEAN DEFAULT FALSE,
          notes TEXT,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_contacts_company_id ON contacts(company_id);
    END IF;

    -- Check if deals table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deals') THEN
        CREATE TABLE deals (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
          title VARCHAR NOT NULL,
          value DECIMAL(15,2),
          currency VARCHAR DEFAULT 'USD',
          stage VARCHAR NOT NULL,
          probability INTEGER DEFAULT 0,
          expected_close_date DATE,
          actual_close_date DATE,
          description TEXT,
          notes TEXT,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_deals_company_id ON deals(company_id);
        CREATE INDEX idx_deals_contact_id ON deals(contact_id);
    END IF;

    -- Check if projects table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'projects') THEN
        CREATE TABLE projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
          title VARCHAR NOT NULL,
          description TEXT,
          status VARCHAR NOT NULL DEFAULT 'planning',
          start_date DATE,
          end_date DATE,
          budget JSONB,
          tags TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_projects_company_id ON projects(company_id);
        CREATE INDEX idx_projects_deal_id ON projects(deal_id);
    END IF;

    -- Check if time_entries table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        CREATE TABLE time_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
          resource_name VARCHAR,
          description TEXT,
          start_time TIMESTAMP WITH TIME ZONE,
          duration INTEGER,
          date DATE NOT NULL,
          tags TEXT[],
          billable BOOLEAN DEFAULT TRUE,
          hourly_rate DECIMAL(10,2),
          currency VARCHAR DEFAULT 'USD',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
        CREATE INDEX idx_time_entries_date ON time_entries(date);
    END IF;
END
$$;

-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers for all tables
DO $$
BEGIN
    -- Only create triggers if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
        CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_deals_updated_at') THEN
        CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at') THEN
        CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_time_entries_updated_at') THEN
        CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Insert some sample data for testing
INSERT INTO companies (name, industry, email, phone, notes) VALUES 
  ('TechCorp Solutions', 'Technology', 'contact@techcorp.com', '+1-555-0123', 'Leading software development company')
ON CONFLICT DO NOTHING;

INSERT INTO companies (name, industry, email, phone, notes) VALUES 
  ('Marketing Plus', 'Marketing', 'hello@marketingplus.com', '+1-555-0456', 'Digital marketing agency')
ON CONFLICT DO NOTHING;

-- Get company IDs for sample data
DO $$
DECLARE
    techcorp_id UUID;
    marketing_id UUID;
BEGIN
    -- Get company IDs
    SELECT id INTO techcorp_id FROM companies WHERE name = 'TechCorp Solutions' LIMIT 1;
    SELECT id INTO marketing_id FROM companies WHERE name = 'Marketing Plus' LIMIT 1;
    
    -- Insert sample deals if companies exist
    IF techcorp_id IS NOT NULL THEN
        INSERT INTO deals (company_id, title, value, currency, stage, probability, expected_close_date, description, notes)
        VALUES (techcorp_id, 'Software Development Project', 50000.00, 'USD', 'proposal', 75, CURRENT_DATE + INTERVAL '30 days', 'Custom CRM development', 'High priority client')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF marketing_id IS NOT NULL THEN
        INSERT INTO deals (company_id, title, value, currency, stage, probability, expected_close_date, description, notes)
        VALUES (marketing_id, 'Digital Marketing Campaign', 25000.00, 'USD', 'negotiation', 60, CURRENT_DATE + INTERVAL '20 days', 'SEO and social media campaign', 'Quarterly contract')
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

SELECT 'Database tables created successfully!' as status;