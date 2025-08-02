import { create } from 'zustand';
import type { 
  Company, 
  Contact, 
  Deal,
  Project,
  ProjectResource,
  ProjectExpense,
  ProjectBudget,
  CompanyFormData, 
  ContactFormData, 
  DealFormData,
  ProjectFormData,
  ProjectResourceFormData,
  ProjectExpenseFormData,
  CompanyFilters, 
  ContactFilters,
  DealFilters,
  ProjectFilters
} from '../types/crm';

interface CrmState {
  // Data
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  projects: Project[];
  
  // UI State
  isLoading: boolean;
  selectedCompany: Company | null;
  selectedContact: Contact | null;
  selectedDeal: Deal | null;
  selectedProject: Project | null;
  
  // Actions - Companies
  addCompany: (companyData: CompanyFormData) => void;
  updateCompany: (id: string, companyData: Partial<CompanyFormData>) => void;
  deleteCompany: (id: string) => void;
  setSelectedCompany: (company: Company | null) => void;
  getCompanyById: (id: string) => Company | undefined;
  getFilteredCompanies: (filters: CompanyFilters) => Company[];
  
  // Actions - Contacts
  addContact: (contactData: ContactFormData) => void;
  updateContact: (id: string, contactData: Partial<ContactFormData>) => void;
  deleteContact: (id: string) => void;
  setSelectedContact: (contact: Contact | null) => void;
  getContactById: (id: string) => Contact | undefined;
  getContactsByCompany: (companyId: string) => Contact[];
  getFilteredContacts: (filters: ContactFilters) => Contact[];
  
  // Actions - Deals
  addDeal: (dealData: DealFormData) => void;
  updateDeal: (id: string, dealData: Partial<DealFormData>) => void;
  deleteDeal: (id: string) => void;
  setSelectedDeal: (deal: Deal | null) => void;
  getDealById: (id: string) => Deal | undefined;
  getDealsByCompany: (companyId: string) => Deal[];
  getFilteredDeals: (filters: DealFilters) => Deal[];
  
  // Actions - Projects
  addProject: (projectData: ProjectFormData) => void;
  updateProject: (id: string, projectData: Partial<ProjectFormData>) => void;
  deleteProject: (id: string) => void;
  convertDealToProject: (dealId: string, projectData?: Partial<ProjectFormData>) => Project;
  setSelectedProject: (project: Project | null) => void;
  getProjectById: (id: string) => Project | undefined;
  getProjectsByCompany: (companyId: string) => Project[];
  getFilteredProjects: (filters: ProjectFilters) => Project[];
  
  // Budget calculation utilities
  calculateProjectBudget: (budget: Omit<ProjectBudget, 'totalResourceCost' | 'totalExpenseCost' | 'contingencyCost' | 'overheadCost' | 'totalCost' | 'grossMargin' | 'marginPercentage'>) => ProjectBudget;
  addResourceToProject: (projectId: string, resource: ProjectResourceFormData) => void;
  updateProjectResource: (projectId: string, resourceId: string, resource: Partial<ProjectResourceFormData>) => void;
  removeResourceFromProject: (projectId: string, resourceId: string) => void;
  addExpenseToProject: (projectId: string, expense: ProjectExpenseFormData) => void;
  updateProjectExpense: (projectId: string, expenseId: string, expense: Partial<ProjectExpenseFormData>) => void;
  removeExpenseFromProject: (projectId: string, expenseId: string) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  initializeSampleData: () => void;
}

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const useCrmStore = create<CrmState>((set, get) => ({
  // Initial state
  companies: [],
  contacts: [],
  deals: [],
  projects: [],
  isLoading: false,
  selectedCompany: null,
  selectedContact: null,
  selectedDeal: null,
  selectedProject: null,

  // Company actions
  addCompany: (companyData: CompanyFormData) => {
    const newCompany: Company = {
      id: generateId(),
      ...companyData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      companies: [...state.companies, newCompany],
    }));
  },

  updateCompany: (id: string, companyData: Partial<CompanyFormData>) => {
    set((state) => ({
      companies: state.companies.map((company) =>
        company.id === id
          ? { ...company, ...companyData, updatedAt: new Date() }
          : company
      ),
    }));
  },

  deleteCompany: (id: string) => {
    set((state) => ({
      companies: state.companies.filter((company) => company.id !== id),
      contacts: state.contacts.filter((contact) => contact.companyId !== id), // Remove associated contacts
      selectedCompany: state.selectedCompany?.id === id ? null : state.selectedCompany,
    }));
  },

  setSelectedCompany: (company: Company | null) => {
    set({ selectedCompany: company });
  },

  getCompanyById: (id: string) => {
    return get().companies.find((company) => company.id === id);
  },

  getFilteredCompanies: (filters: CompanyFilters) => {
    const { companies } = get();
    
    return companies.filter((company) => {
      const matchesSearch = !filters.search || 
        company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        company.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || company.status === filters.status;
      const matchesIndustry = !filters.industry || company.industry === filters.industry;
      const matchesSize = !filters.size || company.size === filters.size;
      
      return matchesSearch && matchesStatus && matchesIndustry && matchesSize;
    });
  },

  // Contact actions
  addContact: (contactData: ContactFormData) => {
    const newContact: Contact = {
      id: generateId(),
      ...contactData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // If this is set as primary, make sure no other contact for this company is primary
    if (contactData.isPrimary) {
      set((state) => ({
        contacts: [
          ...state.contacts.map((contact) =>
            contact.companyId === contactData.companyId
              ? { ...contact, isPrimary: false }
              : contact
          ),
          newContact,
        ],
      }));
    } else {
      set((state) => ({
        contacts: [...state.contacts, newContact],
      }));
    }
  },

  updateContact: (id: string, contactData: Partial<ContactFormData>) => {
    set((state) => {
      const contact = state.contacts.find(c => c.id === id);
      if (!contact) return state;

      let updatedContacts = state.contacts.map((c) =>
        c.id === id
          ? { ...c, ...contactData, updatedAt: new Date() }
          : c
      );

      // If setting this contact as primary, remove primary from others in same company
      if (contactData.isPrimary) {
        updatedContacts = updatedContacts.map((c) =>
          c.companyId === contact.companyId && c.id !== id
            ? { ...c, isPrimary: false }
            : c
        );
      }

      return { contacts: updatedContacts };
    });
  },

  deleteContact: (id: string) => {
    set((state) => ({
      contacts: state.contacts.filter((contact) => contact.id !== id),
      selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
    }));
  },

  setSelectedContact: (contact: Contact | null) => {
    set({ selectedContact: contact });
  },

  getContactById: (id: string) => {
    return get().contacts.find((contact) => contact.id === id);
  },

  getContactsByCompany: (companyId: string) => {
    return get().contacts.filter((contact) => contact.companyId === companyId);
  },

  getFilteredContacts: (filters: ContactFilters) => {
    const { contacts } = get();
    
    return contacts.filter((contact) => {
      const matchesSearch = !filters.search || 
        contact.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = !filters.companyId || contact.companyId === filters.companyId;
      const matchesStatus = !filters.status || contact.status === filters.status;
      
      return matchesSearch && matchesCompany && matchesStatus;
    });
  },

  // Deal actions
  addDeal: (dealData: DealFormData) => {
    const newDeal: Deal = {
      id: generateId(),
      ...dealData,
      tags: dealData.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      deals: [...state.deals, newDeal],
    }));
  },

  updateDeal: (id: string, dealData: Partial<DealFormData>) => {
    set((state) => ({
      deals: state.deals.map((deal) =>
        deal.id === id
          ? { ...deal, ...dealData, updatedAt: new Date() }
          : deal
      ),
    }));
  },

  deleteDeal: (id: string) => {
    set((state) => ({
      deals: state.deals.filter((deal) => deal.id !== id),
      selectedDeal: state.selectedDeal?.id === id ? null : state.selectedDeal,
    }));
  },

  setSelectedDeal: (deal: Deal | null) => {
    set({ selectedDeal: deal });
  },

  getDealById: (id: string) => {
    return get().deals.find((deal) => deal.id === id);
  },

  getDealsByCompany: (companyId: string) => {
    return get().deals.filter((deal) => deal.companyId === companyId);
  },

  getFilteredDeals: (filters: DealFilters) => {
    const { deals } = get();
    
    return deals.filter((deal) => {
      const matchesSearch = !filters.search || 
        deal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        deal.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = !filters.companyId || deal.companyId === filters.companyId;
      const matchesStage = !filters.stage || deal.stage === filters.stage;
      const matchesPriority = !filters.priority || deal.priority === filters.priority;
      const matchesStatus = !filters.status || deal.status === filters.status;
      
      const matchesValueMin = filters.valueMin === undefined || deal.value >= filters.valueMin;
      const matchesValueMax = filters.valueMax === undefined || deal.value <= filters.valueMax;
      
      const matchesProbabilityMin = filters.probabilityMin === undefined || deal.probability >= filters.probabilityMin;
      const matchesProbabilityMax = filters.probabilityMax === undefined || deal.probability <= filters.probabilityMax;
      
      return matchesSearch && matchesCompany && matchesStage && matchesPriority && 
             matchesStatus && matchesValueMin && matchesValueMax && 
             matchesProbabilityMin && matchesProbabilityMax;
    });
  },

  // Project actions
  addProject: (projectData: ProjectFormData) => {
    const calculatedBudget = get().calculateProjectBudget(projectData.budget);
    
    const newProject: Project = {
      id: generateId(),
      ...projectData,
      budget: calculatedBudget,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdFromDeal: !!projectData.dealId,
    };
    
    set((state) => ({
      projects: [...state.projects, newProject],
    }));
  },

  updateProject: (id: string, projectData: Partial<ProjectFormData>) => {
    const { calculateProjectBudget } = get();
    
    set((state) => ({
      ...state,
      projects: state.projects.map((project) => {
        if (project.id === id) {
          const updatedProject: Project = { 
            ...project, 
            ...projectData, 
            updatedAt: new Date(),
            budget: projectData.budget ? calculateProjectBudget(projectData.budget) : project.budget
          };
          return updatedProject;
        }
        return project;
      })
    }));
  },

  deleteProject: (id: string) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
      selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
    }));
  },

  convertDealToProject: (dealId: string, projectData?: Partial<ProjectFormData>) => {
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
      priority: deal.priority,
      type: 'development',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      budget: {
        totalRevenue: deal.value,
        resources: [],
        expenses: [],
        contingencyPercentage: 10,
        overheadPercentage: 15,
        currency: deal.currency,
      },
      progressPercentage: 0,
      tags: deal.tags,
      notes: deal.notes,
      ...projectData,
    };

    const calculatedBudget = get().calculateProjectBudget(defaultProjectData.budget);
    
    const newProject: Project = {
      id: generateId(),
      ...defaultProjectData,
      budget: calculatedBudget,
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdFromDeal: true,
    };

    set((state) => ({
      projects: [...state.projects, newProject],
    }));

    // Update deal status to indicate it's been converted
    get().updateDeal(dealId, { stage: 'closed-won', status: 'won' });

    return newProject;
  },

  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project });
  },

  getProjectById: (id: string) => {
    return get().projects.find((project) => project.id === id);
  },

  getProjectsByCompany: (companyId: string) => {
    return get().projects.filter((project) => project.companyId === companyId);
  },

  getFilteredProjects: (filters: ProjectFilters) => {
    const { projects } = get();
    
    return projects.filter((project) => {
      const matchesSearch = !filters.search || 
        project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = !filters.companyId || project.companyId === filters.companyId;
      const matchesStatus = !filters.status || project.status === filters.status;
      const matchesPriority = !filters.priority || project.priority === filters.priority;
      const matchesType = !filters.type || project.type === filters.type;
      const matchesManager = !filters.projectManager || project.projectManager === filters.projectManager;
      
      const matchesBudgetMin = filters.budgetMin === undefined || project.budget.totalRevenue >= filters.budgetMin;
      const matchesBudgetMax = filters.budgetMax === undefined || project.budget.totalRevenue <= filters.budgetMax;
      
      const matchesMarginMin = filters.marginMin === undefined || project.budget.marginPercentage >= filters.marginMin;
      const matchesMarginMax = filters.marginMax === undefined || project.budget.marginPercentage <= filters.marginMax;
      
      return matchesSearch && matchesCompany && matchesStatus && matchesPriority && 
             matchesType && matchesManager && matchesBudgetMin && matchesBudgetMax &&
             matchesMarginMin && matchesMarginMax;
    });
  },

  // Budget calculation utilities
  calculateProjectBudget: (budget) => {
    const totalResourceCost = budget.resources.reduce((sum, resource) => 
      sum + (resource.hourlyRate * resource.hoursAllocated), 0
    );
    
    const totalExpenseCost = budget.expenses.reduce((sum, expense) => 
      sum + expense.plannedCost, 0
    );
    
    const contingencyCost = (totalResourceCost + totalExpenseCost) * (budget.contingencyPercentage / 100);
    const overheadCost = (totalResourceCost + totalExpenseCost) * (budget.overheadPercentage / 100);
    
    const totalCost = totalResourceCost + totalExpenseCost + contingencyCost + overheadCost;
    const grossMargin = budget.totalRevenue - totalCost;
    const marginPercentage = budget.totalRevenue > 0 ? (grossMargin / budget.totalRevenue) * 100 : 0;

    return {
      ...budget,
      totalResourceCost,
      totalExpenseCost, 
      contingencyCost,
      overheadCost,
      totalCost,
      grossMargin,
      marginPercentage,
    };
  },

  addResourceToProject: (projectId: string, resourceData: ProjectResourceFormData) => {
    const newResource: ProjectResource = {
      id: generateId(),
      ...resourceData,
    };

    set((state) => {
      const updatedProjects = state.projects.map((project) => {
        if (project.id === projectId) {
          const updatedBudget = {
            ...project.budget,
            resources: [...project.budget.resources, newResource],
          };
          
          return {
            ...project,
            budget: get().calculateProjectBudget(updatedBudget),
            updatedAt: new Date(),
          };
        }
        return project;
      });
      
      return { projects: updatedProjects };
    });
  },

  updateProjectResource: (projectId: string, resourceId: string, resourceData: Partial<ProjectResourceFormData>) => {
    set((state) => {
      const updatedProjects = state.projects.map((project) => {
        if (project.id === projectId) {
          const updatedResources = project.budget.resources.map((resource) =>
            resource.id === resourceId
              ? { ...resource, ...resourceData }
              : resource
          );
          
          const updatedBudget = {
            ...project.budget,
            resources: updatedResources,
          };
          
          return {
            ...project,
            budget: get().calculateProjectBudget(updatedBudget),
            updatedAt: new Date(),
          };
        }
        return project;
      });
      
      return { projects: updatedProjects };
    });
  },

  removeResourceFromProject: (projectId: string, resourceId: string) => {
    set((state) => {
      const updatedProjects = state.projects.map((project) => {
        if (project.id === projectId) {
          const updatedBudget = {
            ...project.budget,
            resources: project.budget.resources.filter((r) => r.id !== resourceId),
          };
          
          return {
            ...project,
            budget: get().calculateProjectBudget(updatedBudget),
            updatedAt: new Date(),
          };
        }
        return project;
      });
      
      return { projects: updatedProjects };
    });
  },

  addExpenseToProject: (projectId: string, expenseData: ProjectExpenseFormData) => {
    const newExpense: ProjectExpense = {
      id: generateId(),
      ...expenseData,
    };

    set((state) => {
      const updatedProjects = state.projects.map((project) => {
        if (project.id === projectId) {
          const updatedBudget = {
            ...project.budget,
            expenses: [...project.budget.expenses, newExpense],
          };
          
          return {
            ...project,
            budget: get().calculateProjectBudget(updatedBudget),
            updatedAt: new Date(),
          };
        }
        return project;
      });
      
      return { projects: updatedProjects };
    });
  },

  updateProjectExpense: (projectId: string, expenseId: string, expenseData: Partial<ProjectExpenseFormData>) => {
    set((state) => {
      const updatedProjects = state.projects.map((project) => {
        if (project.id === projectId) {
          const updatedExpenses = project.budget.expenses.map((expense) =>
            expense.id === expenseId
              ? { ...expense, ...expenseData }
              : expense
          );
          
          const updatedBudget = {
            ...project.budget,
            expenses: updatedExpenses,
          };
          
          return {
            ...project,
            budget: get().calculateProjectBudget(updatedBudget),
            updatedAt: new Date(),
          };
        }
        return project;
      });
      
      return { projects: updatedProjects };
    });
  },

  removeExpenseFromProject: (projectId: string, expenseId: string) => {
    set((state) => {
      const updatedProjects = state.projects.map((project) => {
        if (project.id === projectId) {
          const updatedBudget = {
            ...project.budget,
            expenses: project.budget.expenses.filter((e) => e.id !== expenseId),
          };
          
          return {
            ...project,
            budget: get().calculateProjectBudget(updatedBudget),
            updatedAt: new Date(),
          };
        }
        return project;
      });
      
      return { projects: updatedProjects };
    });
  },

  // Utility actions
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeSampleData: () => {
    const sampleCompanies: Company[] = [
      {
        id: 'comp1',
        name: 'Acme Corporation',
        email: 'info@acme.com',
        phone: '+1 (555) 123-4567',
        website: 'https://acme.com',
        address: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        industry: 'Technology',
        size: 'medium',
        notes: 'Potential partner for Q2 project',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'comp2',
        name: 'TechStart Inc',
        email: 'hello@techstart.com',
        phone: '+1 (555) 987-6543',
        website: 'https://techstart.com',
        address: '456 Innovation Blvd',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94105',
        country: 'USA',
        industry: 'Software',
        size: 'startup',
        notes: 'Interested in our enterprise solution',
        status: 'prospect',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
    ];

    const sampleContacts: Contact[] = [
      {
        id: 'cont1',
        companyId: 'comp1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@acme.com',
        phone: '+1 (555) 123-4568',
        jobTitle: 'CEO',
        department: 'Executive',
        isPrimary: true,
        notes: 'Decision maker for tech purchases',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'cont2',
        companyId: 'comp1',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@acme.com',
        phone: '+1 (555) 123-4569',
        jobTitle: 'CTO',
        department: 'Technology',
        isPrimary: false,
        notes: 'Technical contact for implementation',
        status: 'active',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
      {
        id: 'cont3',
        companyId: 'comp2',
        firstName: 'Mike',
        lastName: 'Wilson',
        email: 'mike@techstart.com',
        phone: '+1 (555) 987-6544',
        jobTitle: 'Founder',
        department: 'Executive',
        isPrimary: true,
        status: 'active',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
    ];

    const sampleDeals: Deal[] = [
      {
        id: 'deal1',
        companyId: 'comp1',
        title: 'Enterprise Software License',
        description: 'Annual software license for 500 users with premium support',
        value: 125000,
        currency: 'USD',
        probability: 75,
        stage: 'proposal',
        priority: 'high',
        source: 'referral',
        expectedCloseDate: new Date('2024-03-15'),
        valueSource: 'manual',
        tags: ['enterprise', 'annual-contract', 'priority'],
        notes: 'Strong interest from CTO, waiting for budget approval',
        status: 'active',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-25'),
      },
      {
        id: 'deal2',
        companyId: 'comp1',
        title: 'Professional Services Package',
        description: 'Implementation and training services for new software deployment',
        value: 45000,
        currency: 'USD',
        probability: 85,
        stage: 'negotiation',
        priority: 'medium',
        source: 'website',
        expectedCloseDate: new Date('2024-02-28'),
        valueSource: 'manual',
        tags: ['services', 'implementation'],
        notes: 'Follow-up deal to main license, almost ready to close',
        status: 'active',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-28'),
      },
      {
        id: 'deal3',
        companyId: 'comp2',
        title: 'Startup Package',
        description: 'Discounted startup package for first-year customers',
        value: 18000,
        currency: 'USD',
        probability: 60,
        stage: 'qualification',
        priority: 'medium',
        source: 'cold-call',
        expectedCloseDate: new Date('2024-04-01'),
        valueSource: 'manual',
        tags: ['startup', 'discount'],
        notes: 'Early stage startup, price sensitive but very interested',
        status: 'active',
        createdAt: new Date('2024-01-22'),
        updatedAt: new Date('2024-01-28'),
      },
      {
        id: 'deal4',
        companyId: 'comp1',
        title: 'Additional User Licenses',
        description: 'Expansion deal for 200 additional user licenses',
        value: 35000,
        currency: 'USD',
        probability: 90,
        stage: 'closed-won',
        priority: 'low',
        source: 'referral',
        expectedCloseDate: new Date('2024-01-30'),
        actualCloseDate: new Date('2024-01-28'),
        valueSource: 'manual',
        tags: ['expansion', 'existing-customer'],
        notes: 'Quick expansion deal from existing happy customer',
        status: 'won',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-28'),
      },
    ];

    const sampleProjects: Project[] = [
      {
        id: 'proj1',
        dealId: 'deal1',
        companyId: 'comp1',
        title: 'Enterprise Software Implementation',
        description: 'Full implementation of enterprise software suite with custom integrations',
        projectManager: 'Sarah Johnson',
        status: 'active',
        priority: 'high',
        type: 'implementation',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-06-01'),
        actualStartDate: new Date('2024-02-01'),
        budget: {
          totalRevenue: 125000,
          currency: 'USD',
          contingencyPercentage: 10,
          overheadPercentage: 15,
          resources: [
            {
              id: 'res1',
              name: 'John Developer',
              type: 'internal',
              role: 'Senior Developer',
              hourlyRate: 85,
              currency: 'USD',
              hoursAllocated: 400,
              hoursActual: 120,
              startDate: new Date('2024-02-01'),
              endDate: new Date('2024-05-01'),
              skills: ['React', 'Node.js', 'Database Design'],
            },
            {
              id: 'res2',
              name: 'Maria Designer',
              type: 'internal',
              role: 'UX Designer',
              hourlyRate: 75,
              currency: 'USD',
              hoursAllocated: 200,
              hoursActual: 80,
              startDate: new Date('2024-02-01'),
              endDate: new Date('2024-04-01'),
              skills: ['UI/UX', 'Figma', 'User Research'],
            },
            {
              id: 'res3',
              name: 'External QA Team',
              type: 'external',
              role: 'QA Specialist',
              hourlyRate: 60,
              currency: 'USD',
              hoursAllocated: 150,
              startDate: new Date('2024-04-01'),
              endDate: new Date('2024-06-01'),
              skills: ['Testing', 'Automation', 'Quality Assurance'],
            },
          ],
          expenses: [
            {
              id: 'exp1',
              category: 'software',
              description: 'Development Tools & Licenses',
              plannedCost: 5000,
              actualCost: 4500,
              currency: 'USD',
              status: 'paid',
              vendor: 'Microsoft',
            },
            {
              id: 'exp2',
              category: 'hardware',
              description: 'Testing Devices',
              plannedCost: 3000,
              currency: 'USD',
              status: 'approved',
              vendor: 'Apple',
            },
            {
              id: 'exp3',
              category: 'travel',
              description: 'Client Site Visits',
              plannedCost: 2500,
              currency: 'USD',
              status: 'planned',
            },
          ],
          // These will be calculated
          totalResourceCost: 0,
          totalExpenseCost: 0,
          contingencyCost: 0,
          overheadCost: 0,
          totalCost: 0,
          grossMargin: 0,
          marginPercentage: 0,
        },
        progressPercentage: 35,
        milestones: [],
        tags: ['enterprise', 'implementation', 'high-priority'],
        notes: 'Critical project for major client. Regular check-ins scheduled.',
        createdAt: new Date('2024-01-30'),
        updatedAt: new Date('2024-02-15'),
        createdFromDeal: true,
      },
      {
        id: 'proj2',
        companyId: 'comp2',
        title: 'Startup MVP Development',
        description: 'Building minimum viable product for startup client',
        projectManager: 'Mike Wilson',
        status: 'planning',
        priority: 'medium',
        type: 'development',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-01'),
        budget: {
          totalRevenue: 45000,
          currency: 'USD',
          contingencyPercentage: 15,
          overheadPercentage: 20,
          resources: [
            {
              id: 'res4',
              name: 'Junior Developer',
              type: 'internal',
              role: 'Full Stack Developer',
              hourlyRate: 65,
              currency: 'USD',
              hoursAllocated: 320,
              startDate: new Date('2024-03-01'),
              endDate: new Date('2024-05-01'),
              skills: ['JavaScript', 'React', 'API Development'],
            },
            {
              id: 'res5',
              name: 'Freelance Designer',
              type: 'contractor',
              role: 'UI Designer',
              hourlyRate: 55,
              currency: 'USD',
              hoursAllocated: 80,
              startDate: new Date('2024-03-01'),
              endDate: new Date('2024-03-15'),
              skills: ['UI Design', 'Prototyping'],
            },
          ],
          expenses: [
            {
              id: 'exp4',
              category: 'software',
              description: 'Cloud Services',
              plannedCost: 1500,
              currency: 'USD',
              status: 'approved',
              vendor: 'AWS',
            },
          ],
          // These will be calculated
          totalResourceCost: 0,
          totalExpenseCost: 0,
          contingencyCost: 0,
          overheadCost: 0,
          totalCost: 0,
          grossMargin: 0,
          marginPercentage: 0,
        },
        progressPercentage: 5,
        milestones: [],
        tags: ['startup', 'mvp', 'fast-track'],
        notes: 'Tight timeline, focus on core features first.',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-05'),
        createdFromDeal: false,
      },
    ];

    // Calculate budgets for sample projects
    const projectsWithCalculatedBudgets = sampleProjects.map(project => ({
      ...project,
      budget: get().calculateProjectBudget(project.budget),
    }));

    set({
      companies: sampleCompanies,
      contacts: sampleContacts,
      deals: sampleDeals,
      projects: projectsWithCalculatedBudgets,
    });
  },
}));