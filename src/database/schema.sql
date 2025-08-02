-- CRM Database Schema
-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS project_expenses;
DROP TABLE IF EXISTS project_resources;
DROP TABLE IF EXISTS project_milestones;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS companies;

-- Companies table
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    industry TEXT,
    size TEXT CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
    notes TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'prospect')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    job_title TEXT,
    department TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT 0,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
);

-- Deals table
CREATE TABLE deals (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    value REAL NOT NULL,
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
    probability INTEGER NOT NULL CHECK (probability >= 0 AND probability <= 100),
    stage TEXT NOT NULL CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    source TEXT NOT NULL CHECK (source IN ('website', 'referral', 'cold-call', 'email', 'social-media', 'event', 'other')),
    expected_close_date DATETIME NOT NULL,
    actual_close_date DATETIME,
    assigned_user_id TEXT,
    
    value_source TEXT NOT NULL CHECK (value_source IN ('manual', 'quotation')) DEFAULT 'manual',
    
    -- Project conversion tracking
    converted_to_project BOOLEAN DEFAULT 0,
    converted_to_project_at DATETIME,
    project_id TEXT,
    
    tags TEXT, -- JSON array as text
    notes TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'won', 'lost', 'on-hold')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
);


-- Projects table
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    deal_id TEXT,
    company_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    project_manager TEXT,
    status TEXT NOT NULL CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    type TEXT NOT NULL CHECK (type IN ('development', 'consulting', 'implementation', 'support', 'other')),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    actual_start_date DATETIME,
    actual_end_date DATETIME,
    
    -- Budget fields
    budget_total_revenue REAL NOT NULL,
    budget_contingency_percentage REAL NOT NULL,
    budget_overhead_percentage REAL NOT NULL,
    budget_currency TEXT NOT NULL,
    budget_total_resource_cost REAL NOT NULL,
    budget_total_expense_cost REAL NOT NULL,
    budget_contingency_cost REAL NOT NULL,
    budget_overhead_cost REAL NOT NULL,
    budget_total_cost REAL NOT NULL,
    budget_gross_margin REAL NOT NULL,
    budget_margin_percentage REAL NOT NULL,
    
    -- Progress and metadata
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    tags TEXT, -- JSON array as text
    notes TEXT NOT NULL,
    created_from_deal BOOLEAN NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals (id) ON DELETE SET NULL
);

-- Project Resources table
CREATE TABLE project_resources (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('internal', 'external', 'contractor')),
    role TEXT NOT NULL,
    hourly_rate REAL NOT NULL,
    currency TEXT NOT NULL,
    hours_allocated REAL NOT NULL,
    hours_actual REAL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    skills TEXT, -- JSON array as text
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Project Expenses table
CREATE TABLE project_expenses (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('software', 'hardware', 'travel', 'materials', 'licenses', 'other')),
    description TEXT NOT NULL,
    planned_cost REAL NOT NULL,
    actual_cost REAL,
    currency TEXT NOT NULL,
    due_date DATETIME,
    vendor TEXT,
    status TEXT NOT NULL CHECK (status IN ('planned', 'approved', 'ordered', 'received', 'paid')),
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- Project Milestones table
CREATE TABLE project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATETIME NOT NULL,
    completed_date DATETIME,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in-progress', 'completed', 'delayed')),
    deliverables TEXT, -- JSON array as text
    dependencies TEXT, -- JSON array as text
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);


-- Create indexes for better performance
CREATE INDEX idx_contacts_company_id ON contacts (company_id);
CREATE INDEX idx_contacts_is_primary ON contacts (is_primary);
CREATE INDEX idx_deals_company_id ON deals (company_id);
CREATE INDEX idx_deals_stage ON deals (stage);
CREATE INDEX idx_deals_status ON deals (status);
CREATE INDEX idx_deals_expected_close_date ON deals (expected_close_date);
CREATE INDEX idx_projects_company_id ON projects (company_id);
CREATE INDEX idx_projects_deal_id ON projects (deal_id);
CREATE INDEX idx_projects_status ON projects (status);
CREATE INDEX idx_projects_start_date ON projects (start_date);
CREATE INDEX idx_projects_end_date ON projects (end_date);
CREATE INDEX idx_project_resources_project_id ON project_resources (project_id);
CREATE INDEX idx_project_expenses_project_id ON project_expenses (project_id);
CREATE INDEX idx_project_milestones_project_id ON project_milestones (project_id);

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_companies_updated_at 
    AFTER UPDATE ON companies
    FOR EACH ROW
    BEGIN
        UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_contacts_updated_at 
    AFTER UPDATE ON contacts
    FOR EACH ROW
    BEGIN
        UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_deals_updated_at 
    AFTER UPDATE ON deals
    FOR EACH ROW
    BEGIN
        UPDATE deals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;


CREATE TRIGGER update_projects_updated_at 
    AFTER UPDATE ON projects
    FOR EACH ROW
    BEGIN
        UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

