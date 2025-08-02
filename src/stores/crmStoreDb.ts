import { create } from 'zustand';
import { supabaseApiSimple } from '../database/supabaseClientSimple';
import type { 
  Company, 
  Contact, 
  Deal,
  Project,
  ProjectBudget,
  TimeEntry,
  WeeklyTimeReport,
  ProjectTimeStats,
  TimerState,
  CompanyFormData, 
  ContactFormData, 
  DealFormData,
  ProjectFormData,
  ProjectResourceFormData,
  ProjectExpenseFormData,
  TimeEntryFormData,
  CompanyFilters, 
  ContactFilters,
  DealFilters,
  ProjectFilters,
  TimeEntryFilters,
} from '../types/crm';

interface CrmState {
  // Data - these are cached from database
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
  timeEntries: TimeEntry[];
  
  // Timer state
  timer: TimerState;
  
  // UI State
  isLoading: boolean;
  selectedCompany: Company | null;
  selectedContact: Contact | null;
  selectedDeal: Deal | null;
  selectedProject: Project | null;
  
  // Data loading actions
  loadAllData: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  refreshDeals: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  refreshTimeEntries: () => Promise<void>;
  
  // Actions - Companies
  addCompany: (companyData: CompanyFormData) => Promise<Company>;
  updateCompany: (id: string, companyData: Partial<CompanyFormData>) => Promise<Company | null>;
  deleteCompany: (id: string) => Promise<boolean>;
  setSelectedCompany: (company: Company | null) => void;
  getCompanyById: (id: string) => Company | undefined;
  getFilteredCompanies: (filters: CompanyFilters) => Company[];
  
  // Actions - Contacts
  addContact: (contactData: ContactFormData) => Promise<Contact>;
  updateContact: (id: string, contactData: Partial<ContactFormData>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  setSelectedContact: (contact: Contact | null) => void;
  getContactById: (id: string) => Contact | undefined;
  getContactsByCompany: (companyId: string) => Contact[];
  getFilteredContacts: (filters: ContactFilters) => Contact[];
  
  // Actions - Deals
  addDeal: (dealData: DealFormData) => Promise<Deal>;
  updateDeal: (id: string, dealData: Partial<DealFormData>) => Promise<Deal | null>;
  deleteDeal: (id: string) => Promise<boolean>;
  setSelectedDeal: (deal: Deal | null) => void;
  getDealById: (id: string) => Deal | undefined;
  getDealsByCompany: (companyId: string) => Deal[];
  getFilteredDeals: (filters: DealFilters) => Deal[];
  
  // Actions - Projects
  addProject: (projectData: ProjectFormData) => Promise<Project>;
  updateProject: (id: string, projectData: Partial<ProjectFormData>) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  convertDealToProject: (dealId: string, projectData?: Partial<ProjectFormData>) => Promise<Project>;
  setSelectedProject: (project: Project | null) => void;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByCompany: (companyId: string) => Project[];
  getFilteredProjects: (filters: ProjectFilters) => Project[];
  
  // Budget calculation utilities
  calculateProjectBudget: (budget: Omit<ProjectBudget, 'totalResourceCost' | 'totalExpenseCost' | 'contingencyCost' | 'overheadCost' | 'totalCost' | 'grossMargin' | 'marginPercentage'>) => ProjectBudget;
  addResourceToProject: (projectId: string, resource: ProjectResourceFormData) => Promise<void>;
  updateProjectResource: (projectId: string, resourceId: string, resource: Partial<ProjectResourceFormData>) => Promise<void>;
  removeResourceFromProject: (projectId: string, resourceId: string) => Promise<void>;
  addExpenseToProject: (projectId: string, expense: ProjectExpenseFormData) => Promise<void>;
  updateProjectExpense: (projectId: string, expenseId: string, expense: Partial<ProjectExpenseFormData>) => Promise<void>;
  removeExpenseFromProject: (projectId: string, expenseId: string) => Promise<void>;
  
  
  // Actions - Time Tracking
  addTimeEntry: (timeEntryData: TimeEntryFormData) => Promise<TimeEntry>;
  updateTimeEntry: (id: string, timeEntryData: Partial<TimeEntryFormData>) => Promise<TimeEntry | null>;
  deleteTimeEntry: (id: string) => Promise<boolean>;
  getTimeEntryById: (id: string) => TimeEntry | undefined;
  getTimeEntriesByProject: (projectId: string) => TimeEntry[];
  getTimeEntriesForDateRange: (startDate: Date, endDate: Date) => TimeEntry[];
  getFilteredTimeEntries: (filters: TimeEntryFilters) => TimeEntry[];
  
  // Timer actions
  startTimer: (projectId: string, description: string, billable?: boolean, hourlyRate?: number) => void;
  stopTimer: () => Promise<TimeEntry | null>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  updateTimerDescription: (description: string) => void;
  getTimerElapsed: () => number;
  
  // Time reporting actions
  getWeeklyTimeReport: (weekStart: Date) => WeeklyTimeReport;
  getProjectTimeStats: (projectId: string) => ProjectTimeStats;
  getDailyTimeEntries: (date: Date) => TimeEntry[];
  getTimeEntriesForWeek: (weekStart: Date) => TimeEntry[];
  
  // Utility functions
  formatDuration: (minutes: number) => string;
  calculateProjectMargins: (projectId: string) => { budgetedMargin: number; actualMargin: number; variance: number };
  
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  initializeSampleData: () => Promise<void>;
  clearAndReinitializeData: () => Promise<void>;
  recoverDataFromBackup: () => Promise<boolean>;
  exportAllData: () => any;
  importAllData: (data: any) => Promise<void>;
}

// Supabase is initialized via environment variables

export const useCrmStore = create<CrmState>((set, get) => ({
  // Initial state
  companies: [],
  contacts: [],
  deals: [],
  projects: [],
  timeEntries: [],
  timer: {
    isRunning: false,
    currentEntry: undefined,
    elapsedTime: 0,
  },
  isLoading: false,
  selectedCompany: null,
  selectedContact: null,
  selectedDeal: null,
  selectedProject: null,

  // Data loading actions
  loadAllData: async () => {
    set({ isLoading: true });
    try {
      console.log('🔄 Loading data from Supabase...');
      const [companies, contacts, deals, projects, timeEntries] = await Promise.all([
        supabaseApiSimple.getCompanies(),
        supabaseApiSimple.getContacts(),
        supabaseApiSimple.getDeals(),
        supabaseApiSimple.getProjects(),
        supabaseApiSimple.getTimeEntries(),
      ]);
      
      set({ companies, contacts, deals, projects, timeEntries });
      console.log('✅ Data loaded from cloud database');
    } catch (error) {
      console.error('❌ Failed to load data from Supabase:', error);
      // Don't throw error to prevent app crash, just log it
    } finally {
      set({ isLoading: false });
    }
  },

  refreshCompanies: async () => {
    try {
      const companies = await supabaseApiSimple.getCompanies();
      set({ companies });
    } catch (error) {
      console.error('Failed to refresh companies:', error);
    }
  },

  refreshContacts: async () => {
    try {
      const contacts = await supabaseApiSimple.getContacts();
      set({ contacts });
    } catch (error) {
      console.error('Failed to refresh contacts:', error);
    }
  },

  refreshDeals: async () => {
    try {
      const deals = await supabaseApiSimple.getDeals();
      set({ deals });
    } catch (error) {
      console.error('Failed to refresh deals:', error);
    }
  },

  refreshProjects: async () => {
    try {
      const projects = await supabaseApiSimple.getProjects();
      set({ projects });
    } catch (error) {
      console.error('Failed to refresh projects:', error);
    }
  },


  refreshTimeEntries: async () => {
    try {
      const timeEntries = await supabaseApiSimple.getTimeEntries();
      set({ timeEntries });
    } catch (error) {
      console.error('Failed to refresh time entries:', error);
    }
  },


  // Company actions
  addCompany: async (companyData: CompanyFormData) => {
    set({ isLoading: true });
    try {
      const newCompany = await supabaseApiSimple.createCompany({
        name: companyData.name,
        industry: companyData.industry || '',
        size: companyData.size || '',
        website: companyData.website || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        address: {
          address: companyData.address || '',
          city: companyData.city || '',
          state: companyData.state || '',
          zipCode: companyData.zipCode || '',
          country: companyData.country || ''
        },
        notes: companyData.notes || '',
        tags: companyData.tags || []
      });
      await get().refreshCompanies();
      return newCompany;
    } catch (error) {
      console.error('Failed to add company:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateCompany: async (id: string, companyData: Partial<CompanyFormData>) => {
    try {
      const updatedCompany = await supabaseApiSimple.updateCompany(id, {
        name: companyData.name,
        industry: companyData.industry,
        size: companyData.size,
        website: companyData.website,
        phone: companyData.phone,
        email: companyData.email,
        address: companyData.address ? {
          address: companyData.address,
          city: companyData.city || '',
          state: companyData.state || '',
          zipCode: companyData.zipCode || '',
          country: companyData.country || ''
        } : undefined,
        notes: companyData.notes,
        tags: companyData.tags
      });
      await get().refreshCompanies();
      return updatedCompany;
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  },

  deleteCompany: async (id: string) => {
    try {
      await supabaseApiSimple.deleteCompany(id);
      await Promise.all([
        get().refreshCompanies(),
        get().refreshContacts(),
        get().refreshDeals(),
        get().refreshProjects(),
      ]);
      
      // Clear selection if deleted company was selected
      const { selectedCompany } = get();
      if (selectedCompany?.id === id) {
        set({ selectedCompany: null });
      }
      return true;
    } catch (error) {
      console.error('Failed to delete company:', error);
      throw error;
    }
  },

  setSelectedCompany: (company: Company | null) => {
    set({ selectedCompany: company });
  },

  getCompanyById: (id: string) => {
    return get().companies.find((company) => company.id === id);
  },

  getFilteredCompanies: (filters: CompanyFilters) => {
    // Filter from cached data for now - could optimize with Supabase queries later
    const { companies } = get();
    let filtered = companies;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(search) ||
        company.industry.toLowerCase().includes(search) ||
        company.email.toLowerCase().includes(search)
      );
    }

    if (filters.industry) {
      filtered = filtered.filter(company => company.industry === filters.industry);
    }

    if (filters.size) {
      filtered = filtered.filter(company => company.size === filters.size);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(company => 
        filters.tags!.some(tag => company.tags.includes(tag))
      );
    }

    return filtered;
  },

  // Contact actions
  addContact: async (contactData: ContactFormData) => {
    set({ isLoading: true });
    try {
      const newContact = await supabaseApiSimple.createContact({
        companyId: contactData.companyId,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        email: contactData.email || '',
        phone: contactData.phone || '',
        position: contactData.jobTitle || '',
        department: contactData.department || '',
        isPrimary: contactData.isPrimary || false,
        notes: contactData.notes || '',
        tags: contactData.tags || []
      });
      await get().refreshContacts();
      return newContact;
    } catch (error) {
      console.error('Failed to add contact:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateContact: async (id: string, contactData: Partial<ContactFormData>) => {
    try {
      const current = get().contacts.find(c => c.id === id);
      if (!current) throw new Error('Contact not found');
      
      const updatedContact = await supabaseApiSimple.updateContact(id, {
        companyId: contactData.companyId ?? current.companyId,
        firstName: contactData.firstName ?? current.firstName,
        lastName: contactData.lastName ?? current.lastName,
        email: contactData.email ?? current.email,
        phone: contactData.phone ?? current.phone,
        position: contactData.jobTitle ?? current.position,
        department: contactData.department ?? current.department,
        isPrimary: contactData.isPrimary ?? current.isPrimary,
        notes: contactData.notes ?? current.notes,
        tags: contactData.tags ?? current.tags
      });
      await get().refreshContacts();
      return updatedContact;
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  },

  deleteContact: async (id: string) => {
    try {
      await supabaseApiSimple.deleteContact(id);
      await get().refreshContacts();
      
      // Clear selection if deleted contact was selected
      const { selectedContact } = get();
      if (selectedContact?.id === id) {
        set({ selectedContact: null });
      }
      return true;
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  },

  setSelectedContact: (contact: Contact | null) => {
    set({ selectedContact: contact });
  },

  getContactById: (id: string) => {
    return get().contacts.find((contact) => contact.id === id);
  },

  getContactsByCompany: (companyId: string) => {
    const { contacts } = get();
    return contacts.filter(contact => contact.companyId === companyId);
  },

  getFilteredContacts: (filters: ContactFilters) => {
    const { contacts } = get();
    let filtered = contacts;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.firstName.toLowerCase().includes(search) ||
        contact.lastName.toLowerCase().includes(search) ||
        contact.email.toLowerCase().includes(search) ||
        contact.position.toLowerCase().includes(search)
      );
    }

    if (filters.companyId) {
      filtered = filtered.filter(contact => contact.companyId === filters.companyId);
    }

    if (filters.department) {
      filtered = filtered.filter(contact => contact.department === filters.department);
    }

    if (filters.isPrimary !== undefined) {
      filtered = filtered.filter(contact => contact.isPrimary === filters.isPrimary);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(contact => 
        filters.tags!.some(tag => contact.tags.includes(tag))
      );
    }

    return filtered;
  },

  // Deal actions
  addDeal: async (dealData: DealFormData) => {
    set({ isLoading: true });
    try {
      const newDeal = await supabaseApiSimple.createDeal({
        companyId: dealData.companyId,
        contactId: dealData.contactId || '',
        title: dealData.title,
        value: dealData.value || 0,
        currency: dealData.currency || 'USD',
        stage: dealData.stage,
        probability: dealData.probability || 0,
        expectedCloseDate: dealData.expectedCloseDate,
        actualCloseDate: dealData.actualCloseDate,
        description: dealData.description || '',
        notes: dealData.notes || '',
        tags: dealData.tags || []
      });
      await get().refreshDeals();
      return newDeal;
    } catch (error) {
      console.error('Failed to add deal:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateDeal: async (id: string, dealData: Partial<DealFormData>) => {
    try {
      const current = get().deals.find(d => d.id === id);
      if (!current) throw new Error('Deal not found');
      
      const updatedDeal = await supabaseApiSimple.updateDeal(id, {
        companyId: dealData.companyId ?? current.companyId,
        contactId: dealData.contactId ?? current.contactId,
        title: dealData.title ?? current.title,
        value: dealData.value ?? current.value,
        currency: dealData.currency ?? current.currency,
        stage: dealData.stage ?? current.stage,
        probability: dealData.probability ?? current.probability,
        expectedCloseDate: dealData.expectedCloseDate ?? current.expectedCloseDate,
        actualCloseDate: dealData.actualCloseDate ?? current.actualCloseDate,
        description: dealData.description ?? current.description,
        notes: dealData.notes ?? current.notes,
        tags: dealData.tags ?? current.tags
      });
      await get().refreshDeals();
      return updatedDeal;
    } catch (error) {
      console.error('Failed to update deal:', error);
      throw error;
    }
  },

  deleteDeal: async (id: string) => {
    try {
      await supabaseApiSimple.deleteDeal(id);
      await get().refreshDeals();
      
      // Clear selection if deleted deal was selected
      const { selectedDeal } = get();
      if (selectedDeal?.id === id) {
        set({ selectedDeal: null });
      }
      return true;
    } catch (error) {
      console.error('Failed to delete deal:', error);
      throw error;
    }
  },

  setSelectedDeal: (deal: Deal | null) => {
    set({ selectedDeal: deal });
  },

  getDealById: (id: string) => {
    return get().deals.find((deal) => deal.id === id);
  },

  getDealsByCompany: (companyId: string) => {
    const { deals } = get();
    return deals.filter(deal => deal.companyId === companyId);
  },

  getFilteredDeals: (filters: DealFilters) => {
    const { deals } = get();
    let filtered = deals;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(deal => 
        deal.title.toLowerCase().includes(search) ||
        deal.description.toLowerCase().includes(search)
      );
    }

    if (filters.companyId) {
      filtered = filtered.filter(deal => deal.companyId === filters.companyId);
    }

    if (filters.stage) {
      filtered = filtered.filter(deal => deal.stage === filters.stage);
    }

    if (filters.minValue !== undefined) {
      filtered = filtered.filter(deal => deal.value >= filters.minValue!);
    }

    if (filters.maxValue !== undefined) {
      filtered = filtered.filter(deal => deal.value <= filters.maxValue!);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(deal => 
        filters.tags!.some(tag => deal.tags.includes(tag))
      );
    }

    return filtered;
  },

  // Project actions
  addProject: async (projectData: ProjectFormData) => {
    set({ isLoading: true });
    try {
      const calculatedBudget = get().calculateProjectBudget(projectData.budget);
      const newProject = await supabaseApiSimple.createProject({
        companyId: projectData.companyId,
        dealId: projectData.dealId || '',
        title: projectData.title,
        description: projectData.description || '',
        status: projectData.status,
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        budget: calculatedBudget,
        tags: projectData.tags || [],
        priority: 'medium',
        type: 'development',
        notes: '',
        progressPercentage: 0,
        milestones: []
      });
      await get().refreshProjects();
      return newProject;
    } catch (error) {
      console.error('Failed to add project:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProject: async (id: string, projectData: Partial<ProjectFormData>) => {
    try {
      const current = get().projects.find(p => p.id === id);
      if (!current) throw new Error('Project not found');
      
      const calculatedBudget = projectData.budget ? get().calculateProjectBudget(projectData.budget) : current.budget;
      const updatedProject = await supabaseApiSimple.updateProject(id, {
        companyId: projectData.companyId ?? current.companyId,
        dealId: projectData.dealId ?? current.dealId,
        title: projectData.title ?? current.title,
        description: projectData.description ?? current.description,
        status: projectData.status ?? current.status,
        startDate: projectData.startDate ?? current.startDate,
        endDate: projectData.endDate ?? current.endDate,
        budget: calculatedBudget,
        tags: projectData.tags ?? current.tags,
        priority: current.priority,
        type: current.type,
        notes: current.notes,
        progressPercentage: current.progressPercentage,
        milestones: current.milestones
      });
      await get().refreshProjects();
      return updatedProject;
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    try {
      await supabaseApiSimple.deleteProject(id);
      await get().refreshProjects();
      
      // Clear selection if deleted project was selected
      const { selectedProject } = get();
      if (selectedProject?.id === id) {
        set({ selectedProject: null });
      }
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  convertDealToProject: async (dealId: string, projectData?: Partial<ProjectFormData>) => {
    set({ isLoading: true });
    try {
      const deal = get().getDealById(dealId);
      if (!deal) {
        throw new Error('Deal not found');
      }

      const defaultProjectData: ProjectFormData = {
        dealId: deal.id,
        companyId: deal.companyId,
        title: deal.title,
        description: deal.description,
        status: 'planning',
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        budget: {
          totalRevenue: deal.value,
          resources: [],
          expenses: [],
          contingencyPercentage: 10,
          currency: deal.currency,
        },
        tags: deal.tags,
        ...projectData,
      };

      const calculatedBudget = get().calculateProjectBudget(defaultProjectData.budget);
      
      // Create project in Supabase
      const newProject = await supabaseApiSimple.createProject({
        companyId: defaultProjectData.companyId,
        dealId: defaultProjectData.dealId,
        title: defaultProjectData.title,
        description: defaultProjectData.description || '',
        status: defaultProjectData.status,
        startDate: defaultProjectData.startDate,
        endDate: defaultProjectData.endDate,
        budget: calculatedBudget,
        tags: defaultProjectData.tags,
        priority: 'medium',
        type: 'development',
        notes: '',
        progressPercentage: 0,
        milestones: []
      });

      // Update deal status to indicate it's been converted
      await get().updateDeal(dealId, { 
        stage: 'closed-won'
      });
      await get().refreshProjects();

      return newProject;
    } catch (error) {
      console.error('Failed to convert deal to project:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project });
  },

  getProjectById: (id: string) => {
    return get().projects.find((project) => project.id === id);
  },

  getProjectsByCompany: (companyId: string) => {
    const { projects } = get();
    return projects.filter(project => project.companyId === companyId);
  },

  getFilteredProjects: (filters: ProjectFilters) => {
    const { projects } = get();
    let filtered = projects;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(search) ||
        project.description.toLowerCase().includes(search)
      );
    }

    if (filters.companyId) {
      filtered = filtered.filter(project => project.companyId === filters.companyId);
    }

    if (filters.status) {
      filtered = filtered.filter(project => project.status === filters.status);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(project => 
        filters.tags!.some(tag => project.tags.includes(tag))
      );
    }

    return filtered;
  },

  // Budget calculation utilities
  calculateProjectBudget: (budget) => {
    const totalResourceCost = budget.resources.reduce((sum, resource) => {
      if (resource.rateType === 'daily' && resource.dailyRate && resource.daysAllocated) {
        return sum + (resource.dailyRate * resource.daysAllocated);
      } else {
        return sum + (resource.hourlyRate * resource.hoursAllocated);
      }
    }, 0);
    
    const totalExpenseCost = budget.expenses.reduce((sum, expense) => 
      sum + expense.plannedCost, 0
    );
    
    const contingencyCost = (totalResourceCost + totalExpenseCost) * (budget.contingencyPercentage / 100);
    
    const totalCost = totalResourceCost + totalExpenseCost + contingencyCost;
    const grossMargin = budget.totalRevenue - totalCost;
    const marginPercentage = budget.totalRevenue > 0 ? (grossMargin / budget.totalRevenue) * 100 : 0;

    return {
      ...budget,
      totalResourceCost,
      totalExpenseCost, 
      contingencyCost,
      totalCost,
      grossMargin,
      marginPercentage,
    };
  },

  addResourceToProject: async (projectId: string, resourceData: ProjectResourceFormData) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const newResource = {
        id: crypto.randomUUID(),
        ...resourceData
      };
      
      const updatedBudget = {
        ...project.budget,
        resources: [...project.budget.resources, newResource]
      };
      
      const calculatedBudget = get().calculateProjectBudget(updatedBudget);
      await supabaseApiSimple.updateProject(projectId, { budget: calculatedBudget });
      await get().refreshProjects();
    } catch (error) {
      console.error('Failed to add resource to project:', error);
      throw error;
    }
  },

  updateProjectResource: async (projectId: string, resourceId: string, resourceData: Partial<ProjectResourceFormData>) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const updatedBudget = {
        ...project.budget,
        resources: project.budget.resources.map(resource => 
          resource.id === resourceId ? { ...resource, ...resourceData } : resource
        )
      };
      
      const calculatedBudget = get().calculateProjectBudget(updatedBudget);
      await supabaseApiSimple.updateProject(projectId, { budget: calculatedBudget });
      await get().refreshProjects();
    } catch (error) {
      console.error('Failed to update project resource:', error);
      throw error;
    }
  },

  removeResourceFromProject: async (projectId: string, resourceId: string) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const updatedBudget = {
        ...project.budget,
        resources: project.budget.resources.filter(resource => resource.id !== resourceId)
      };
      
      const calculatedBudget = get().calculateProjectBudget(updatedBudget);
      await supabaseApiSimple.updateProject(projectId, { budget: calculatedBudget });
      await get().refreshProjects();
    } catch (error) {
      console.error('Failed to remove resource from project:', error);
      throw error;
    }
  },

  addExpenseToProject: async (projectId: string, expenseData: ProjectExpenseFormData) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const newExpense = {
        id: crypto.randomUUID(),
        ...expenseData
      };
      
      const updatedBudget = {
        ...project.budget,
        expenses: [...project.budget.expenses, newExpense]
      };
      
      const calculatedBudget = get().calculateProjectBudget(updatedBudget);
      await supabaseApiSimple.updateProject(projectId, { budget: calculatedBudget });
      await get().refreshProjects();
    } catch (error) {
      console.error('Failed to add expense to project:', error);
      throw error;
    }
  },

  updateProjectExpense: async (projectId: string, expenseId: string, expenseData: Partial<ProjectExpenseFormData>) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const updatedBudget = {
        ...project.budget,
        expenses: project.budget.expenses.map(expense => 
          expense.id === expenseId ? { ...expense, ...expenseData } : expense
        )
      };
      
      const calculatedBudget = get().calculateProjectBudget(updatedBudget);
      await supabaseApiSimple.updateProject(projectId, { budget: calculatedBudget });
      await get().refreshProjects();
    } catch (error) {
      console.error('Failed to update project expense:', error);
      throw error;
    }
  },

  removeExpenseFromProject: async (projectId: string, expenseId: string) => {
    try {
      const project = get().projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const updatedBudget = {
        ...project.budget,
        expenses: project.budget.expenses.filter(expense => expense.id !== expenseId)
      };
      
      const calculatedBudget = get().calculateProjectBudget(updatedBudget);
      await supabaseApiSimple.updateProject(projectId, { budget: calculatedBudget });
      await get().refreshProjects();
    } catch (error) {
      console.error('Failed to remove expense from project:', error);
      throw error;
    }
  },


  // Time Tracking Actions
  addTimeEntry: async (timeEntryData: TimeEntryFormData) => {
    try {
      const newEntry = await supabaseApiSimple.createTimeEntry({
        projectId: timeEntryData.projectId,
        resourceName: timeEntryData.resourceName,
        description: timeEntryData.description || '',
        startTime: timeEntryData.startTime || new Date(),
        duration: timeEntryData.duration || 0,
        date: timeEntryData.date || new Date(),
        tags: timeEntryData.tags || [],
        billable: timeEntryData.billable ?? true,
        hourlyRate: timeEntryData.hourlyRate || 0,
        currency: timeEntryData.currency || 'USD',
        isRunning: false
      });
      await get().refreshTimeEntries();
      return newEntry;
    } catch (error) {
      console.error('Failed to add time entry:', error);
      throw error;
    }
  },

  updateTimeEntry: async (id: string, timeEntryData: Partial<TimeEntryFormData>) => {
    try {
      const current = get().timeEntries.find(t => t.id === id);
      if (!current) throw new Error('Time entry not found');
      
      const updatedEntry = await supabaseApiSimple.updateTimeEntry(id, {
        projectId: timeEntryData.projectId ?? current.projectId,
        resourceName: timeEntryData.resourceName ?? current.resourceName,
        description: timeEntryData.description ?? current.description,
        startTime: timeEntryData.startTime ?? current.startTime,
        duration: timeEntryData.duration ?? current.duration,
        date: timeEntryData.date ?? current.date,
        tags: timeEntryData.tags ?? current.tags,
        billable: timeEntryData.billable ?? current.billable,
        hourlyRate: timeEntryData.hourlyRate ?? current.hourlyRate,
        currency: timeEntryData.currency ?? current.currency
      });
      await get().refreshTimeEntries();
      return updatedEntry;
    } catch (error) {
      console.error('Failed to update time entry:', error);
      throw error;
    }
  },

  deleteTimeEntry: async (id: string) => {
    try {
      await supabaseApiSimple.deleteTimeEntry(id);
      await get().refreshTimeEntries();
      return true;
    } catch (error) {
      console.error('Failed to delete time entry:', error);
      throw error;
    }
  },

  getTimeEntryById: (id: string) => {
    const { timeEntries } = get();
    return timeEntries.find(entry => entry.id === id);
  },

  getTimeEntriesByProject: (projectId: string) => {
    const { timeEntries } = get();
    return timeEntries.filter(entry => entry.projectId === projectId);
  },

  getTimeEntriesForDateRange: (startDate: Date, endDate: Date) => {
    const { timeEntries } = get();
    return timeEntries.filter(entry => 
      entry.date >= startDate && entry.date <= endDate
    );
  },

  getFilteredTimeEntries: (filters: TimeEntryFilters) => {
    const { timeEntries, projects } = get();
    let entries = timeEntries;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      entries = entries.filter(entry => 
        entry.description.toLowerCase().includes(search) ||
        entry.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    if (filters.projectId) {
      entries = entries.filter(entry => entry.projectId === filters.projectId);
    }

    if (filters.companyId) {
      const companyProjectIds = projects
        .filter(p => p.companyId === filters.companyId)
        .map(p => p.id);
      entries = entries.filter(entry => companyProjectIds.includes(entry.projectId));
    }

    if (filters.dateFrom) {
      entries = entries.filter(entry => entry.date >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      entries = entries.filter(entry => entry.date <= filters.dateTo!);
    }

    if (filters.billable !== undefined) {
      entries = entries.filter(entry => entry.billable === filters.billable);
    }

    if (filters.tags && filters.tags.length > 0) {
      entries = entries.filter(entry => 
        filters.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    if (filters.minDuration !== undefined) {
      entries = entries.filter(entry => entry.duration >= filters.minDuration!);
    }

    if (filters.maxDuration !== undefined) {
      entries = entries.filter(entry => entry.duration <= filters.maxDuration!);
    }

    return entries;
  },

  startTimer: (projectId: string, description: string, billable: boolean = true, hourlyRate?: number) => {
    const { timer } = get();
    
    // Stop current timer if running
    if (timer.isRunning) {
      get().stopTimer();
    }

    const startTime = new Date();
    set({
      timer: {
        isRunning: true,
        currentEntry: {
          projectId,
          description,
          startTime,
          tags: [],
          billable,
          hourlyRate,
        },
        elapsedTime: 0,
      }
    });

    // Start elapsed time counter
    const interval = setInterval(() => {
      const { timer } = get();
      if (!timer.isRunning) {
        clearInterval(interval);
        return;
      }
      
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      set({
        timer: {
          ...timer,
          elapsedTime: elapsed,
        }
      });
    }, 1000);
  },

  stopTimer: async () => {
    const { timer } = get();
    if (!timer.isRunning || !timer.currentEntry) {
      return null;
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - timer.currentEntry.startTime.getTime()) / (1000 * 60));

    try {
      const timeEntry = await get().addTimeEntry({
        projectId: timer.currentEntry.projectId,
        description: timer.currentEntry.description,
        startTime: timer.currentEntry.startTime,
        endTime,
        duration,
        date: timer.currentEntry.startTime,
        tags: timer.currentEntry.tags,
        billable: timer.currentEntry.billable,
        hourlyRate: timer.currentEntry.hourlyRate,
        currency: 'USD', // Default currency
      });

      set({
        timer: {
          isRunning: false,
          currentEntry: undefined,
          elapsedTime: 0,
        }
      });

      return timeEntry;
    } catch (error) {
      console.error('Failed to save time entry:', error);
      return null;
    }
  },

  pauseTimer: () => {
    const { timer } = get();
    if (timer.isRunning) {
      set({
        timer: {
          ...timer,
          isRunning: false,
        }
      });
    }
  },

  resumeTimer: () => {
    const { timer } = get();
    if (!timer.isRunning && timer.currentEntry) {
      set({
        timer: {
          ...timer,
          isRunning: true,
        }
      });
    }
  },

  updateTimerDescription: (description: string) => {
    const { timer } = get();
    if (timer.currentEntry) {
      set({
        timer: {
          ...timer,
          currentEntry: {
            ...timer.currentEntry,
            description,
          }
        }
      });
    }
  },

  getTimerElapsed: () => {
    const { timer } = get();
    return timer.elapsedTime;
  },

  getWeeklyTimeReport: (weekStart: Date) => {
    const { projects, companies, timeEntries } = get();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Get time entries for the week
    const weekTimeEntries = timeEntries.filter(entry => 
      entry.date >= weekStart && entry.date <= weekEnd
    );
    
    // Calculate totals
    const totalMinutes = weekTimeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableMinutes = weekTimeEntries.filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.duration, 0);
    const totalRevenue = weekTimeEntries.filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration / 60) * (entry.hourlyRate || 0), 0);
    
    // Group by project
    const projectBreakdown = projects.map(project => {
      const projectEntries = weekTimeEntries.filter(entry => entry.projectId === project.id);
      const company = companies.find(c => c.id === project.companyId);
      
      if (projectEntries.length === 0) return null;
      
      const projectMinutes = projectEntries.reduce((sum, entry) => sum + entry.duration, 0);
      const projectRevenue = projectEntries.filter(entry => entry.billable)
        .reduce((sum, entry) => sum + (entry.duration / 60) * (entry.hourlyRate || 0), 0);
      
      return {
        projectId: project.id,
        projectTitle: project.title,
        companyName: company?.name || 'Unknown Company',
        totalMinutes: projectMinutes,
        totalHours: projectMinutes / 60,
        totalRevenue: projectRevenue,
        entryCount: projectEntries.length
      };
    }).filter(Boolean);
    
    return {
      weekStart,
      weekEnd,
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      totalRevenue,
      entries: weekTimeEntries,
      projectBreakdown: projectBreakdown.map(item => ({
        projectId: item.projectId,
        projectTitle: item.projectTitle,  
        companyName: item.companyName,
        hours: item.totalHours,
        billableHours: item.totalHours,
        revenue: item.totalRevenue
      }))
    };
  },

  getProjectTimeStats: (projectId: string) => {
    const { projects, timeEntries } = get();
    const project = projects.find(p => p.id === projectId);
    const projectTimeEntries = timeEntries.filter(entry => entry.projectId === projectId);
    
    const totalTrackedMinutes = projectTimeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalTrackedHours = totalTrackedMinutes / 60;
    const billableHours = projectTimeEntries.filter(entry => entry.billable)
      .reduce((sum, entry) => sum + entry.duration, 0) / 60;
    const totalRevenue = projectTimeEntries.filter(entry => entry.billable)
      .reduce((sum, entry) => sum + (entry.duration / 60) * (entry.hourlyRate || 0), 0);
    
    const averageHourlyRate = billableHours > 0 ? totalRevenue / billableHours : 0;
    
    let budgetedHours = 0;
    if (project) {
      budgetedHours = project.budget.resources.reduce((sum, resource) => 
        sum + resource.hoursAllocated, 0);
    }
    
    return {
      projectId,
      totalTrackedHours,
      totalBillableHours: billableHours,
      totalRevenue,
      budgetedHours,
      remainingHours: Math.max(0, budgetedHours - totalTrackedHours),
      hoursUtilization: budgetedHours > 0 ? (totalTrackedHours / budgetedHours) * 100 : 0,
      averageHourlyRate,
      lastActivity: projectTimeEntries.length > 0 ? new Date(Math.max(...projectTimeEntries.map(e => e.date.getTime()))) : new Date()
    };
  },

  getDailyTimeEntries: (date: Date) => {
    const { timeEntries } = get();
    const dateStr = date.toISOString().split('T')[0];
    return timeEntries.filter(entry => 
      entry.date.toISOString().split('T')[0] === dateStr
    );
  },

  getTimeEntriesForWeek: (weekStart: Date) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return get().getTimeEntriesForDateRange(weekStart, weekEnd);
  },

  formatDuration: (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  },

  calculateProjectMargins: (projectId: string) => {
    const { projects } = get();
    const project = projects.find(p => p.id === projectId);
    const stats = get().getProjectTimeStats(projectId);

    if (!project) {
      return { budgetedMargin: 0, actualMargin: 0, variance: 0 };
    }

    const budgetedMargin = project.budget.grossMargin;
    const actualCosts = stats.totalTrackedHours * (stats.averageHourlyRate || 0);
    const actualMargin = project.budget.totalRevenue - actualCosts;
    const variance = actualMargin - budgetedMargin;

    return {
      budgetedMargin,
      actualMargin,
      variance,
    };
  },


  // Utility actions
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeSampleData: async () => {
    set({ isLoading: true });
    try {
      // For now, just load existing data from Supabase
      console.log('Loading data from Supabase...');
      await get().loadAllData();
      console.log('✅ Data loaded from cloud database');
      
    } catch (error) {
      console.error('Failed to initialize sample data:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  clearAndReinitializeData: async () => {
    set({ isLoading: true });
    try {
      // Reset store state (note: this doesn't clear Supabase data)
      set({ 
        companies: [], 
        contacts: [], 
        deals: [], 
        projects: [], 
        timeEntries: [],
        selectedCompany: null,
        selectedContact: null,
        selectedDeal: null,
        selectedProject: null,
      });
      
      // Reload data from Supabase
      await get().loadAllData();
      
      console.log('✅ Data reinitialized successfully');
    } catch (error) {
      console.error('Failed to reinitialize data:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  recoverDataFromBackup: async () => {
    set({ isLoading: true });
    try {
      // For cloud database, just reload data
      await get().loadAllData();
      console.log('✅ Data recovered from cloud database');
      return true;
    } catch (error) {
      console.error('Failed to recover data:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  exportAllData: () => {
    const state = get();
    return {
      companies: state.companies,
      contacts: state.contacts,
      deals: state.deals,
      projects: state.projects,
      timeEntries: state.timeEntries,
    };
  },

  importAllData: async (data: any) => {
    set({ isLoading: true });
    try {
      // For cloud database, importing data would require creating records via API
      // This is a simplified implementation - real import would need to use Supabase API
      console.log('⚠️ Import to cloud database not yet implemented');
      console.log('Data to import:', data);
      
      // For now, just reload existing data
      await get().loadAllData();
      
      console.log('✅ Data reloaded from cloud');
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));