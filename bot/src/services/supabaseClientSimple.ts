import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Use environment variables for security
const supabaseUrl = process.env.SUPABASE_URL || 'https://gpejlfhsesjnbeiactlo.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZWpsZmhzZXNqbmJlaWFjdGxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzU2ODYsImV4cCI6MjA2OTY1MTY4Nn0.S70xr_zAksc9uWiFWB3YQhqVN34Kx_OtUmDKB_2uLXc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified API for basic operations
export const supabaseApiSimple = {
  // Test connection
  async testConnection() {
    try {
      const { data, error } = await supabase.from('companies').select('count', { count: 'exact', head: true });
      if (error) throw error;
      return { success: true, message: 'Connected to Supabase successfully!' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  // Company operations
  async getCompanies() {
    const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      industry: row.industry || '',
      size: row.size || '',
      website: row.website || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address || {},
      notes: row.notes || '',
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createCompany(company: any) {
    const { data, error } = await supabase
      .from('companies')
      .insert([{
        name: company.name,
        industry: company.industry || '',
        size: company.size || '',
        website: company.website || '',
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || {},
        notes: company.notes || '',
        tags: company.tags || []
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      industry: data.industry || '',
      size: data.size || '',
      website: data.website || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || {},
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateCompany(id: string, updates: any) {
    const { data, error } = await supabase
      .from('companies')
      .update({
        name: updates.name,
        industry: updates.industry,
        size: updates.size,
        website: updates.website,
        phone: updates.phone,
        email: updates.email,
        address: updates.address,
        notes: updates.notes,
        tags: updates.tags
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      industry: data.industry || '',
      size: data.size || '',
      website: data.website || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || {},
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteCompany(id: string) {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  },

  // Contact operations
  async getContacts() {
    const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      companyId: row.company_id || '',
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email || '',
      phone: row.phone || '',
      position: row.position || '',
      department: row.department || '',
      isPrimary: row.is_primary || false,
      notes: row.notes || '',
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createContact(contact: any) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        company_id: contact.companyId,
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        position: contact.position,
        department: contact.department,
        is_primary: contact.isPrimary,
        notes: contact.notes,
        tags: contact.tags
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id || '',
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email || '',
      phone: data.phone || '',
      position: data.position || '',
      department: data.department || '',
      isPrimary: data.is_primary || false,
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateContact(id: string, updates: any) {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        company_id: updates.companyId,
        first_name: updates.firstName,
        last_name: updates.lastName,
        email: updates.email,
        phone: updates.phone,
        position: updates.position,
        department: updates.department,
        is_primary: updates.isPrimary,
        notes: updates.notes,
        tags: updates.tags
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id || '',
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email || '',
      phone: data.phone || '',
      position: data.position || '',
      department: data.department || '',
      isPrimary: data.is_primary || false,
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteContact(id: string) {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
  },

  // Deal operations
  async getDeals() {
    const { data, error } = await supabase.from('deals').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      companyId: row.company_id || '',
      contactId: row.contact_id || '',
      title: row.title,
      value: row.value || 0,
      currency: row.currency || 'USD',
      stage: row.stage,
      probability: row.probability || 0,
      expectedCloseDate: row.expected_close_date ? new Date(row.expected_close_date) : undefined,
      actualCloseDate: row.actual_close_date ? new Date(row.actual_close_date) : undefined,
      description: row.description || '',
      notes: row.notes || '',
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createDeal(deal: any) {
    const { data, error } = await supabase
      .from('deals')
      .insert([{
        company_id: deal.companyId,
        contact_id: deal.contactId,
        title: deal.title,
        value: deal.value,
        currency: deal.currency,
        stage: deal.stage,
        probability: deal.probability,
        expected_close_date: deal.expectedCloseDate?.toISOString().split('T')[0],
        actual_close_date: deal.actualCloseDate?.toISOString().split('T')[0],
        description: deal.description,
        notes: deal.notes,
        tags: deal.tags
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id || '',
      contactId: data.contact_id || '',
      title: data.title,
      value: data.value || 0,
      currency: data.currency || 'USD',
      stage: data.stage,
      probability: data.probability || 0,
      expectedCloseDate: data.expected_close_date ? new Date(data.expected_close_date) : undefined,
      actualCloseDate: data.actual_close_date ? new Date(data.actual_close_date) : undefined,
      description: data.description || '',
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateDeal(id: string, updates: any) {
    const { data, error } = await supabase
      .from('deals')
      .update({
        company_id: updates.companyId,
        contact_id: updates.contactId,
        title: updates.title,
        value: updates.value,
        currency: updates.currency,
        stage: updates.stage,
        probability: updates.probability,
        expected_close_date: updates.expectedCloseDate?.toISOString().split('T')[0],
        actual_close_date: updates.actualCloseDate?.toISOString().split('T')[0],
        description: updates.description,
        notes: updates.notes,
        tags: updates.tags
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id || '',
      contactId: data.contact_id || '',
      title: data.title,
      value: data.value || 0,
      currency: data.currency || 'USD',
      stage: data.stage,
      probability: data.probability || 0,
      expectedCloseDate: data.expected_close_date ? new Date(data.expected_close_date) : undefined,
      actualCloseDate: data.actual_close_date ? new Date(data.actual_close_date) : undefined,
      description: data.description || '',
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteDeal(id: string) {
    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) throw error;
  },

  // Project operations
  async getProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      companyId: row.company_id || '',
      dealId: row.deal_id || '',
      title: row.title,
      description: row.description || '',
      status: row.status,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      budget: row.budget || { resources: [], expenses: [], contingencyPercentage: 10 },
      tags: row.tags || [],
      priority: 'medium',
      type: 'development',
      notes: '',
      progressPercentage: 0,
      milestones: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createProject(project: any) {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        company_id: project.companyId,
        deal_id: project.dealId,
        title: project.title,
        description: project.description,
        status: project.status,
        start_date: project.startDate?.toISOString().split('T')[0],
        end_date: project.endDate?.toISOString().split('T')[0],
        budget: project.budget,
        tags: project.tags
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id || '',
      dealId: data.deal_id || '',
      title: data.title,
      description: data.description || '',
      status: data.status,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      budget: data.budget || { resources: [], expenses: [], contingencyPercentage: 10 },
      tags: data.tags || [],
      priority: 'medium',
      type: 'development', 
      notes: '',
      progressPercentage: 0,
      milestones: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateProject(id: string, updates: any) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        company_id: updates.companyId,
        deal_id: updates.dealId,
        title: updates.title,
        description: updates.description,
        status: updates.status,
        start_date: updates.startDate?.toISOString().split('T')[0],
        end_date: updates.endDate?.toISOString().split('T')[0],
        budget: updates.budget,
        tags: updates.tags
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      companyId: data.company_id || '',
      dealId: data.deal_id || '',
      title: data.title,
      description: data.description || '',
      status: data.status,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      budget: data.budget || { resources: [], expenses: [], contingencyPercentage: 10 },
      tags: data.tags || [],
      priority: 'medium',
      type: 'development',
      notes: '',
      progressPercentage: 0,
      milestones: [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },

  // Time entry operations
  async getTimeEntries() {
    const { data, error } = await supabase.from('time_entries').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      projectId: row.project_id || '',
      resourceName: row.resource_name,
      description: row.description || '',
      startTime: row.start_time ? new Date(row.start_time) : new Date(),
      duration: row.duration || 0,
      date: new Date(row.date),
      tags: row.tags || [],
      billable: row.billable || true,
      hourlyRate: row.hourly_rate || 0,
      currency: row.currency || 'USD',
      isRunning: false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createTimeEntry(entry: any) {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([{
        project_id: entry.projectId,
        resource_name: entry.resourceName,
        description: entry.description,
        start_time: entry.startTime?.toISOString(),
        duration: entry.duration,
        date: entry.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        tags: entry.tags,
        billable: entry.billable,
        hourly_rate: entry.hourlyRate,
        currency: entry.currency
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id || '',
      resourceName: data.resource_name,
      description: data.description || '',
      startTime: new Date(data.start_time || new Date()),
      duration: data.duration || 0,
      date: new Date(data.date),
      tags: data.tags || [],
      billable: data.billable || true,
      hourlyRate: data.hourly_rate || 0,
      currency: data.currency || 'USD',
      isRunning: false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateTimeEntry(id: string, updates: any) {
    const { data, error } = await supabase
      .from('time_entries')
      .update({
        project_id: updates.projectId,
        resource_name: updates.resourceName,
        description: updates.description,
        start_time: updates.startTime?.toISOString(),
        duration: updates.duration,
        date: updates.date?.toISOString().split('T')[0],
        tags: updates.tags,
        billable: updates.billable,
        hourly_rate: updates.hourlyRate,
        currency: updates.currency
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      projectId: data.project_id || '',
      resourceName: data.resource_name,
      description: data.description || '',
      startTime: new Date(data.start_time || new Date()),
      duration: data.duration || 0,
      date: new Date(data.date),
      tags: data.tags || [],
      billable: data.billable || true,
      hourlyRate: data.hourly_rate || 0,
      currency: data.currency || 'USD',
      isRunning: false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteTimeEntry(id: string) {
    const { error } = await supabase.from('time_entries').delete().eq('id', id);
    if (error) throw error;
  },

  // User operations
  async getUsers() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email || '',
      firstName: row.first_name || '',
      lastName: row.last_name || '',
      isActive: row.is_active || true,
      lastLogin: row.last_login ? new Date(row.last_login) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createUser(userData: { username: string; email?: string; password: string; firstName?: string; lastName?: string }) {
    // Hash password before storing
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        username: userData.username,
        email: userData.email || null,
        password_hash: passwordHash,
        first_name: userData.firstName || null,
        last_name: userData.lastName || null,
        is_active: true
      }])
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      username: data.username,
      email: data.email || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      isActive: data.is_active || true,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async loginUser(username: string, password: string) {
    // Get user by username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (userError || !userData) {
      throw new Error('User not found');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Update last login
    const { error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);
    
    if (updateError) console.warn('Failed to update last login:', updateError);

    return {
      id: userData.id,
      username: userData.username,
      email: userData.email || '',
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      isActive: userData.is_active || true,
      lastLogin: new Date(),
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at)
    };
  },

  async updateUser(id: string, updates: { username?: string; email?: string; firstName?: string; lastName?: string; password?: string }) {
    const updateData: any = {};
    
    if (updates.username) updateData.username = updates.username;
    if (updates.email !== undefined) updateData.email = updates.email || null;
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName || null;
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName || null;
    
    // Hash new password if provided
    if (updates.password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(updates.password, saltRounds);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return {
      id: data.id,
      username: data.username,
      email: data.email || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      isActive: data.is_active || true,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteUser(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async getUserByUsername(username: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    if (!data) return null;
    
    return {
      id: data.id,
      username: data.username,
      email: data.email || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      isActive: data.is_active || true,
      lastLogin: data.last_login ? new Date(data.last_login) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }
};

export default supabase;