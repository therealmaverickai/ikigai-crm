-- Invoicing Tables for Supabase

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR UNIQUE NOT NULL,
  description TEXT NOT NULL,
  
  -- Financial details
  subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timeline
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- Status tracking
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_status VARCHAR NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'failed')),
  
  -- Notes and attachments
  notes TEXT,
  attachments TEXT[], -- Array of file URLs
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  category VARCHAR CHECK (category IN ('time', 'expense', 'fixed', 'milestone')),
  project_resource_id UUID, -- Link to project resource if time-based
  time_entry_ids UUID[], -- Array of time entry IDs if applicable
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice payments table
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_date DATE NOT NULL,
  payment_method VARCHAR CHECK (payment_method IN ('bank-transfer', 'check', 'card', 'cash', 'other')),
  transaction_id VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice reminders table
CREATE TABLE IF NOT EXISTS invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  type VARCHAR NOT NULL CHECK (type IN ('due-soon', 'overdue', 'escalation')),
  sent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  method VARCHAR NOT NULL CHECK (method IN ('email', 'telegram', 'sms')),
  status VARCHAR NOT NULL CHECK (status IN ('sent', 'delivered', 'failed')),
  days_from_due INTEGER NOT NULL, -- Negative for overdue, positive for upcoming
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project invoice settings table (stores invoicing configuration per project)
CREATE TABLE IF NOT EXISTS project_invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  
  -- Invoice trigger settings
  invoice_on VARCHAR NOT NULL DEFAULT 'project-completion' CHECK (invoice_on IN ('project-start', 'project-milestone', 'project-completion', 'monthly', 'custom-date')),
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  invoice_frequency VARCHAR CHECK (invoice_frequency IN ('once', 'monthly', 'quarterly')),
  auto_generate_invoice BOOLEAN DEFAULT true,
  invoice_template VARCHAR,
  late_fee_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Reminder settings
  reminders_enabled BOOLEAN DEFAULT true,
  reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1], -- Days before due date
  overdue_reminder_days INTEGER[] DEFAULT ARRAY[1, 7, 14, 30], -- Days after due date
  reminder_method VARCHAR DEFAULT 'telegram' CHECK (reminder_method IN ('email', 'telegram', 'both')),
  escalation_enabled BOOLEAN DEFAULT false,
  escalation_days INTEGER DEFAULT 30,
  
  -- Financial tracking
  total_billed DECIMAL(15,2) DEFAULT 0,
  total_paid DECIMAL(15,2) DEFAULT 0,
  outstanding_amount DECIMAL(15,2) DEFAULT 0,
  next_invoice_date DATE,
  last_invoice_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_project_invoice_settings_project_id ON project_invoice_settings(project_id);

-- Add update triggers for automatic timestamps
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_invoice_settings_updated_at ON project_invoice_settings;
CREATE TRIGGER update_project_invoice_settings_updated_at 
  BEFORE UPDATE ON project_invoice_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    -- Generate format: INV-YYYY-000001
    SELECT CONCAT(
      'INV-',
      EXTRACT(YEAR FROM CURRENT_DATE),
      '-',
      LPAD(
        (COALESCE(
          (SELECT MAX(CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER))
           FROM invoices 
           WHERE invoice_number LIKE CONCAT('INV-', EXTRACT(YEAR FROM CURRENT_DATE), '-%')),
          0
        ) + 1)::TEXT,
        6,
        '0'
      )
    ) INTO NEW.invoice_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice numbers
DROP TRIGGER IF EXISTS auto_generate_invoice_number ON invoices;
CREATE TRIGGER auto_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Function to calculate line item totals
CREATE OR REPLACE FUNCTION calculate_line_item_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_price := NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate line item totals
DROP TRIGGER IF EXISTS calculate_line_item_total ON invoice_line_items;
CREATE TRIGGER calculate_line_item_total
  BEFORE INSERT OR UPDATE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_line_item_total();

-- Function to update invoice totals when line items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  invoice_id_to_update UUID;
  new_subtotal DECIMAL(15,2);
  new_tax_amount DECIMAL(15,2);
  new_total DECIMAL(15,2);
  tax_rate_val DECIMAL(5,2);
  discount_amount_val DECIMAL(15,2);
BEGIN
  -- Determine which invoice to update
  IF TG_OP = 'DELETE' THEN
    invoice_id_to_update := OLD.invoice_id;
  ELSE
    invoice_id_to_update := NEW.invoice_id;
  END IF;
  
  -- Calculate new subtotal
  SELECT COALESCE(SUM(total_price), 0) INTO new_subtotal
  FROM invoice_line_items
  WHERE invoice_id = invoice_id_to_update;
  
  -- Get tax rate and discount from invoice
  SELECT tax_rate, COALESCE(discount_amount, 0) INTO tax_rate_val, discount_amount_val
  FROM invoices
  WHERE id = invoice_id_to_update;
  
  -- Calculate tax and total
  new_tax_amount := new_subtotal * (tax_rate_val / 100);
  new_total := new_subtotal + new_tax_amount - discount_amount_val;
  
  -- Update invoice
  UPDATE invoices 
  SET subtotal = new_subtotal,
      tax_amount = new_tax_amount,
      total_amount = new_total,
      updated_at = NOW()
  WHERE id = invoice_id_to_update;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice totals when line items change
DROP TRIGGER IF EXISTS update_invoice_totals ON invoice_line_items;
CREATE TRIGGER update_invoice_totals
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_totals();

-- Insert sample invoice settings for existing projects
INSERT INTO project_invoice_settings (project_id, invoice_on, payment_terms_days, auto_generate_invoice)
SELECT id, 'project-completion', 60, true
FROM projects
WHERE id NOT IN (SELECT project_id FROM project_invoice_settings WHERE project_id IS NOT NULL)
ON CONFLICT (project_id) DO NOTHING;

-- Insert sample invoices for demonstration
INSERT INTO invoices (
  project_id, 
  company_id, 
  description, 
  subtotal, 
  tax_rate, 
  tax_amount, 
  total_amount, 
  issue_date, 
  due_date, 
  status, 
  payment_status
)
SELECT 
  p.id as project_id,
  p.company_id,
  CONCAT('Invoice for ', p.title) as description,
  25000.00 as subtotal,
  10.00 as tax_rate,
  2500.00 as tax_amount,
  27500.00 as total_amount,
  CURRENT_DATE - INTERVAL '30 days' as issue_date,
  CURRENT_DATE + INTERVAL '30 days' as due_date,
  'sent' as status,
  'pending' as payment_status
FROM projects p
LIMIT 2
ON CONFLICT DO NOTHING;

-- Insert sample line items for the invoices
INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total_price, category)
SELECT 
  i.id as invoice_id,
  'Project Development Services' as description,
  1 as quantity,
  25000.00 as unit_price,
  25000.00 as total_price,
  'fixed' as category
FROM invoices i
WHERE i.description LIKE 'Invoice for %'
ON CONFLICT DO NOTHING;

SELECT 'Invoicing tables created successfully!' as status;