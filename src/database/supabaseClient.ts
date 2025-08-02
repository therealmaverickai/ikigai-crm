import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabaseTypes';
import type { Company, Contact, Deal, Project, TimeEntry } from '../types/crm';

// Replace these with your actual Supabase project credentials
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Typed API functions for your CRM data
export const supabaseApi = {
  // Companies
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      name: row.name,
      industry: row.industry || '',
      size: row.size || '',
      website: row.website || '',
      phone: row.phone || '',
      email: row.email || '',
      address: row.address as any || {},
      notes: row.notes || '',
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert([{
        name: company.name,
        industry: company.industry,
        size: company.size,
        website: company.website,
        phone: company.phone,
        email: company.email,
        address: company.address,
        notes: company.notes,
        tags: company.tags
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
      address: data.address as any || {},
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateCompany(id: string, updates: Partial<Company>): Promise<Company> {
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
      address: data.address as any || {},
      notes: data.notes || '',
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteCompany(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Contacts
  async getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(row => ({
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

  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
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

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
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

  async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Deals
  async getDeals(): Promise<Deal[]> {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(row => ({
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

  async createDeal(deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
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

  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal> {
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

  async deleteDeal(id: string): Promise<void> {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      companyId: row.company_id || '',
      dealId: row.deal_id || '',
      title: row.title,
      description: row.description || '',
      status: row.status as any,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      budget: row.budget as any || { resources: [], expenses: [], contingencyPercentage: 10 },
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
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
      status: data.status as any,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      budget: data.budget as any || { resources: [], expenses: [], contingencyPercentage: 10 },
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
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
      status: data.status as any,
      startDate: data.start_date ? new Date(data.start_date) : undefined,
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      budget: data.budget as any || { resources: [], expenses: [], contingencyPercentage: 10 },
      tags: data.tags || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Time Entries
  async getTimeEntries(): Promise<TimeEntry[]> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data.map(row => ({
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
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  },

  async createTimeEntry(timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimeEntry> {
    const { data, error } = await supabase
      .from('time_entries')
      .insert([{
        project_id: timeEntry.projectId,
        resource_name: timeEntry.resourceName,
        description: timeEntry.description,
        start_time: timeEntry.startTime.toISOString(),
        duration: timeEntry.duration,
        date: timeEntry.date.toISOString().split('T')[0],
        tags: timeEntry.tags,
        billable: timeEntry.billable,
        hourly_rate: timeEntry.hourlyRate,
        currency: timeEntry.currency
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async deleteTimeEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('time_entries')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Real-time subscriptions
  subscribeToCompanies(callback: (payload: any) => void) {
    return supabase
      .channel('companies-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        callback
      )
      .subscribe();
  },

  subscribeToProjects(callback: (payload: any) => void) {
    return supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        callback
      )
      .subscribe();
  },

  subscribeToTimeEntries(callback: (payload: any) => void) {
    return supabase
      .channel('time-entries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'time_entries' },
        callback
      )
      .subscribe();
  }
};

export default supabase;