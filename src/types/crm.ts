export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'prospect';
}

export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  department?: string;
  isPrimary: boolean; // Primary contact for the company
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
}

export interface CompanyWithContacts extends Company {
  contacts: Contact[];
}

// Form data types for creating/editing
export interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  industry?: string;
  size?: Company['size'];
  notes: string;
  status: Company['status'];
}

export interface ContactFormData {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle?: string;
  department?: string;
  isPrimary: boolean;
  notes?: string;
  status: Contact['status'];
}

export interface Deal {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  value: number; // Deal value in currency - can be inherited from selected quotation or manually set
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  probability: number; // Percentage (0-100)
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: 'website' | 'referral' | 'cold-call' | 'email' | 'social-media' | 'event' | 'other';
  expectedCloseDate: Date;
  actualCloseDate?: Date;
  assignedUserId?: string; // For future user management
  
  valueSource: 'manual' | 'quotation'; // Indicates if value comes from quotation or manual input
  
  // Project conversion tracking
  convertedToProject?: boolean;
  convertedToProjectAt?: Date;
  projectId?: string; // Reference to the created project
  
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'won' | 'lost' | 'on-hold';
}

export interface DealWithCompany extends Deal {
  company: Company;
}

// Form data types for creating/editing deals
export interface DealFormData {
  companyId: string;
  title: string;
  description?: string;
  value: number;
  currency: Deal['currency'];
  probability: number;
  stage: Deal['stage'];
  priority: Deal['priority'];
  source: Deal['source'];
  expectedCloseDate: Date;
  valueSource: Deal['valueSource'];
  tags: string[];
  notes: string;
  status: Deal['status'];
}

// Filter and search types
export interface CompanyFilters {
  search?: string;
  status?: Company['status'];
  industry?: string;
  size?: Company['size'];
}

export interface ContactFilters {
  search?: string;
  companyId?: string;
  status?: Contact['status'];
}

export interface DealFilters {
  search?: string;
  companyId?: string;
  stage?: Deal['stage'];
  priority?: Deal['priority'];
  status?: Deal['status'];
  valueMin?: number;
  valueMax?: number;
  probabilityMin?: number;
  probabilityMax?: number;
}

// Resource and Budget types
export interface ProjectResource {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'contractor';
  role: string;
  rateType: 'hourly' | 'daily';
  hourlyRate: number;
  dailyRate?: number;
  currency: string;
  hoursAllocated: number;
  daysAllocated?: number;
  hoursActual?: number;
  startDate: Date;
  endDate: Date;
  skills: string[];
  notes?: string;
}

export interface ProjectExpense {
  id: string;
  category: 'software' | 'hardware' | 'travel' | 'materials' | 'licenses' | 'other';
  description: string;
  plannedCost: number;
  actualCost?: number;
  currency: string;
  dueDate?: Date;
  vendor?: string;
  status: 'planned' | 'approved' | 'ordered' | 'received' | 'paid';
  notes?: string;
}

export interface ProjectBudget {
  totalRevenue: number; // From original deal value
  resources: ProjectResource[];
  expenses: ProjectExpense[];
  contingencyPercentage: number; // Default 10-15%
  currency: string;
  
  // Calculated fields
  totalResourceCost: number;
  totalExpenseCost: number;
  contingencyCost: number;
  totalCost: number;
  grossMargin: number;
  marginPercentage: number;
}

export interface Project {
  id: string;
  // Deal conversion data
  dealId?: string; // Reference to original deal
  selectedQuotationId?: string; // Reference to selected quotation when created from deal
  companyId: string;
  title: string;
  description?: string;
  
  // Project details
  projectManager?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'development' | 'consulting' | 'implementation' | 'support' | 'other';
  
  // Timeline
  startDate: Date;
  endDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // Budget and financial
  budget: ProjectBudget;
  
  // Invoicing and payments
  invoicing: ProjectInvoicing;
  
  // Progress tracking
  progressPercentage: number; // 0-100
  milestones: ProjectMilestone[];
  
  // Metadata
  tags: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  createdFromDeal?: boolean;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  completedDate?: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  deliverables: string[];
  dependencies: string[]; // Other milestone IDs
}

export interface ProjectWithCompany extends Project {
  company: Company;
  originalDeal?: Deal;
}

// Form data types
export interface ProjectFormData {
  dealId?: string;
  companyId: string;
  title: string;
  description?: string;
  projectManager?: string;
  status: Project['status'];
  priority: Project['priority'];
  type: Project['type'];
  startDate: Date;
  endDate: Date;
  budget: Omit<ProjectBudget, 'totalResourceCost' | 'totalExpenseCost' | 'contingencyCost' | 'totalCost' | 'grossMargin' | 'marginPercentage'>;
  progressPercentage: number;
  tags: string[];
  notes: string;
}

export interface ProjectResourceFormData {
  name: string;
  type: ProjectResource['type'];
  role: string;
  rateType: 'hourly' | 'daily';
  hourlyRate: number;
  dailyRate?: number;
  currency: string;
  hoursAllocated: number;
  daysAllocated?: number;
  startDate: Date;
  endDate: Date;
  skills: string[];
  notes?: string;
}

export interface ProjectExpenseFormData {
  category: ProjectExpense['category'];
  description: string;
  plannedCost: number;
  currency: string;
  dueDate?: Date;
  vendor?: string;
  status: ProjectExpense['status'];
  notes?: string;
}

// Filter types
export interface ProjectFilters {
  search?: string;
  companyId?: string;
  status?: Project['status'];
  priority?: Project['priority'];
  type?: Project['type'];
  projectManager?: string;
  budgetMin?: number;
  budgetMax?: number;
  marginMin?: number;
  marginMax?: number;
}


// Time Tracking Types
export interface TimeEntry {
  id: string;
  projectId: string;
  userId?: string;
  resourceName?: string; // Name of the resource from project budget
  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  isRunning: boolean;
  date: Date; // date when the entry was created
  tags: string[];
  billable: boolean;
  hourlyRate?: number; // Inherited from resource or manual override
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntryWithProject extends TimeEntry {
  project: Project;
  company: Company;
}

export interface WeeklyTimeReport {
  weekStart: Date;
  weekEnd: Date;
  totalHours: number;
  billableHours: number;
  totalRevenue: number;
  entries: TimeEntry[];
  projectBreakdown: Array<{
    projectId: string;
    projectTitle: string;
    companyName: string;
    hours: number;
    billableHours: number;
    revenue: number;
  }>;
}

export interface ProjectTimeStats {
  projectId: string;
  totalTrackedHours: number;
  totalBillableHours: number;
  totalRevenue: number;
  budgetedHours: number;
  remainingHours: number;
  hoursUtilization: number; // percentage
  averageHourlyRate: number;
  lastActivity: Date;
}

export interface DailyTimeEntry {
  date: Date;
  totalHours: number;
  billableHours: number;
  entries: TimeEntry[];
}

// Form data types
export interface TimeEntryFormData {
  projectId: string;
  resourceName?: string; // Selected resource name from project budget
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  date: Date;
  tags: string[];
  billable: boolean;
  hourlyRate?: number; // Inherited from resource or manual override
  currency: string;
}

export interface TimerState {
  isRunning: boolean;
  currentEntry?: {
    projectId: string;
    resourceName?: string;
    description: string;
    startTime: Date;
    tags: string[];
    billable: boolean;
    hourlyRate?: number;
  };
  elapsedTime: number; // in seconds
}

// Filter types
export interface TimeEntryFilters {
  search?: string;
  projectId?: string;
  companyId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  billable?: boolean;
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
}

// Invoicing and Payment Types
export interface InvoiceSettings {
  invoiceOn: 'project-start' | 'project-milestone' | 'project-completion' | 'monthly' | 'custom-date';
  paymentTermsDays: number; // Days to pay (e.g., 30, 60, 90)
  invoiceFrequency?: 'once' | 'monthly' | 'quarterly'; // For recurring projects
  autoGenerateInvoice: boolean;
  invoiceTemplate?: string;
  lateFeePercentage?: number; // Late payment fee percentage
  reminderSettings: InvoiceReminderSettings;
}

export interface InvoiceReminderSettings {
  enabled: boolean;
  reminderDays: number[]; // Days before due date to send reminders (e.g., [7, 3, 1])
  overdueReminderDays: number[]; // Days after due date to send overdue reminders (e.g., [1, 7, 14, 30])
  reminderMethod: 'email' | 'telegram' | 'both';
  escalationEnabled: boolean;
  escalationDays: number; // Days overdue before escalation
}

export interface Invoice {
  id: string;
  projectId: string;
  companyId: string;
  invoiceNumber: string; // Auto-generated or custom format
  description: string;
  
  // Financial details
  subtotal: number;
  taxRate: number; // Percentage
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  currency: string;
  
  // Timeline
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  
  // Status tracking
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'failed';
  
  // Line items
  lineItems: InvoiceLineItem[];
  
  // Payment tracking
  payments: InvoicePayment[];
  
  // Reminder tracking
  remindersSent: InvoiceReminder[];
  
  // Notes and attachments
  notes?: string;
  attachments?: string[]; // File URLs
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: 'time' | 'expense' | 'fixed' | 'milestone';
  projectResourceId?: string; // Link to project resource if time-based
  timeEntryIds?: string[]; // Link to specific time entries
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: 'bank-transfer' | 'check' | 'card' | 'cash' | 'other';
  transactionId?: string;
  notes?: string;
  createdAt: Date;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  type: 'due-soon' | 'overdue' | 'escalation';
  sentDate: Date;
  method: 'email' | 'telegram' | 'sms';
  status: 'sent' | 'delivered' | 'failed';
  daysFromDue: number; // Negative for overdue, positive for upcoming
}

// Enhanced Project interface with invoicing
export interface ProjectInvoicing {
  invoiceSettings: InvoiceSettings;
  generatedInvoices: string[]; // Invoice IDs
  totalBilled: number;
  totalPaid: number;
  outstandingAmount: number;
  nextInvoiceDate?: Date;
  lastInvoiceDate?: Date;
}

// Form data types
export interface InvoiceFormData {
  projectId: string;
  description: string;
  issueDate: Date;
  dueDate?: Date; // Auto-calculated if not provided
  lineItems: Omit<InvoiceLineItem, 'id'>[];
  taxRate: number;
  discountAmount?: number;
  notes?: string;
}

export interface InvoiceSettingsFormData {
  invoiceOn: InvoiceSettings['invoiceOn'];
  paymentTermsDays: number;
  invoiceFrequency?: InvoiceSettings['invoiceFrequency'];
  autoGenerateInvoice: boolean;
  lateFeePercentage?: number;
  reminderSettings: InvoiceReminderSettings;
}

// Filter and search types
export interface InvoiceFilters {
  search?: string;
  projectId?: string;
  companyId?: string;
  status?: Invoice['status'];
  paymentStatus?: Invoice['paymentStatus'];
  dueDateFrom?: Date;
  dueDateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  overdue?: boolean;
}

// Dashboard and reporting types
export interface InvoicingSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  averagePaymentDays: number;
  thisMonthInvoiced: number;
  thisMonthPaid: number;
}

export interface PaymentAnalytics {
  averagePaymentTime: number; // Days
  onTimePaymentRate: number; // Percentage
  overdueRate: number; // Percentage
  topPayingCompanies: Array<{
    companyId: string;
    companyName: string;
    totalPaid: number;
    averagePaymentDays: number;
  }>;
  monthlyPaymentTrend: Array<{
    month: string;
    invoiced: number;
    paid: number;
    outstanding: number;
  }>;
}

