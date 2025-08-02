// Database service layer with persistent storage
import { persistentDb } from '../persistentDatabase';
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
  ProjectFilters,
} from '../../types/crm';

// Company Service
export class BrowserCompanyService {
  create(data: CompanyFormData): Company {
    return persistentDb.companies.create(data) as Company;
  }

  findAll(): Company[] {
    return persistentDb.companies.findAll();
  }

  findById(id: string): Company | null {
    return persistentDb.companies.findById(id);
  }

  findFiltered(filters: CompanyFilters): Company[] {
    const companies = this.findAll();
    
    return companies.filter((company) => {
      const matchesSearch = !filters.search || 
        company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        company.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || company.status === filters.status;
      const matchesIndustry = !filters.industry || company.industry === filters.industry;
      const matchesSize = !filters.size || company.size === filters.size;
      
      return matchesSearch && matchesStatus && matchesIndustry && matchesSize;
    });
  }

  update(id: string, data: Partial<CompanyFormData>): Company | null {
    return persistentDb.companies.update(id, data);
  }

  delete(id: string): boolean {
    // Also delete related contacts, deals, and projects
    const contacts = persistentDb.contacts.findAll().filter(c => c.companyId === id);
    const deals = persistentDb.deals.findAll().filter(d => d.companyId === id);
    const projects = persistentDb.projects.findAll().filter(p => p.companyId === id);
    
    contacts.forEach(contact => persistentDb.contacts.delete(contact.id));
    deals.forEach(deal => persistentDb.deals.delete(deal.id));
    projects.forEach(project => persistentDb.projects.delete(project.id));
    
    return persistentDb.companies.delete(id);
  }

  getStats() {
    const companies = this.findAll();
    return {
      total: companies.length,
      active: companies.filter(c => c.status === 'active').length,
      prospects: companies.filter(c => c.status === 'prospect').length,
    };
  }
}

// Contact Service
export class BrowserContactService {
  create(data: ContactFormData): Contact {
    // If this contact is being set as primary, remove primary from others in same company
    if (data.isPrimary) {
      const existingContacts = persistentDb.contacts.findAll().filter(c => c.companyId === data.companyId);
      existingContacts.forEach(contact => {
        if (contact.isPrimary) {
          persistentDb.contacts.update(contact.id, { isPrimary: false });
        }
      });
    }
    
    return persistentDb.contacts.create(data) as Contact;
  }

  findAll(): Contact[] {
    return persistentDb.contacts.findAll();
  }

  findById(id: string): Contact | null {
    return persistentDb.contacts.findById(id);
  }

  findByCompany(companyId: string): Contact[] {
    return persistentDb.contacts.findAll().filter(c => c.companyId === companyId);
  }

  findFiltered(filters: ContactFilters): Contact[] {
    const contacts = this.findAll();
    
    return contacts.filter((contact) => {
      const matchesSearch = !filters.search || 
        contact.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = !filters.companyId || contact.companyId === filters.companyId;
      const matchesStatus = !filters.status || contact.status === filters.status;
      
      return matchesSearch && matchesCompany && matchesStatus;
    });
  }

  update(id: string, data: Partial<ContactFormData>): Contact | null {
    const contact = this.findById(id);
    if (!contact) return null;

    // If setting as primary, remove primary from others in same company
    if (data.isPrimary) {
      const existingContacts = persistentDb.contacts.findAll().filter(c => 
        c.companyId === contact.companyId && c.id !== id
      );
      existingContacts.forEach(c => {
        if (c.isPrimary) {
          persistentDb.contacts.update(c.id, { isPrimary: false });
        }
      });
    }

    return persistentDb.contacts.update(id, data);
  }

  delete(id: string): boolean {
    return persistentDb.contacts.delete(id);
  }

  getStats() {
    const contacts = this.findAll();
    return {
      total: contacts.length,
      active: contacts.filter(c => c.status === 'active').length,
      primary: contacts.filter(c => c.isPrimary).length,
    };
  }
}

// Deal Service
export class BrowserDealService {
  create(data: DealFormData): Deal {
    return persistentDb.deals.create(data) as Deal;
  }

  findAll(): Deal[] {
    return persistentDb.deals.findAll();
  }

  findById(id: string): Deal | null {
    return persistentDb.deals.findById(id);
  }

  findByCompany(companyId: string): Deal[] {
    return persistentDb.deals.findAll().filter(d => d.companyId === companyId);
  }

  findFiltered(filters: DealFilters): Deal[] {
    const deals = this.findAll();
    
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
  }

  update(id: string, data: Partial<DealFormData>): Deal | null {
    return persistentDb.deals.update(id, data);
  }

  delete(id: string): boolean {
    return persistentDb.deals.delete(id);
  }

  getStats() {
    const deals = this.findAll();
    const wonDeals = deals.filter(d => d.stage === 'closed-won');
    const activeDeals = deals.filter(d => d.status === 'active');
    const pipelineDeals = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage));
    
    return {
      total: deals.length,
      active: activeDeals.length,
      wonCount: wonDeals.length,
      wonValue: wonDeals.reduce((sum, d) => sum + d.value, 0),
      pipelineValue: pipelineDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
    };
  }
}

// Project Service
export class BrowserProjectService {
  create(data: ProjectFormData, calculatedBudget: ProjectBudget): Project {
    const projectData = {
      ...data,
      budget: calculatedBudget,
      milestones: [],
      createdFromDeal: !!data.dealId,
    };
    
    return persistentDb.projects.create(projectData) as Project;
  }

  findAll(): Project[] {
    return persistentDb.projects.findAll();
  }

  findById(id: string): Project | null {
    return persistentDb.projects.findById(id);
  }

  findByCompany(companyId: string): Project[] {
    return persistentDb.projects.findAll().filter(p => p.companyId === companyId);
  }

  findFiltered(filters: ProjectFilters): Project[] {
    const projects = this.findAll();
    
    return projects.filter((project) => {
      const matchesSearch = !filters.search || 
        project.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        project.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = !filters.companyId || project.companyId === filters.companyId;
      const matchesStatus = !filters.status || project.status === filters.status;
      const matchesPriority = !filters.priority || project.priority === filters.priority;
      const matchesType = !filters.type || project.type === filters.type;
      const matchesManager = !filters.projectManager || 
        project.projectManager?.toLowerCase().includes(filters.projectManager.toLowerCase());
      
      const matchesBudgetMin = filters.budgetMin === undefined || project.budget.totalRevenue >= filters.budgetMin;
      const matchesBudgetMax = filters.budgetMax === undefined || project.budget.totalRevenue <= filters.budgetMax;
      
      const matchesMarginMin = filters.marginMin === undefined || project.budget.marginPercentage >= filters.marginMin;
      const matchesMarginMax = filters.marginMax === undefined || project.budget.marginPercentage <= filters.marginMax;
      
      return matchesSearch && matchesCompany && matchesStatus && matchesPriority && 
             matchesType && matchesManager && matchesBudgetMin && matchesBudgetMax &&
             matchesMarginMin && matchesMarginMax;
    });
  }

  update(id: string, data: Partial<ProjectFormData>, calculatedBudget?: ProjectBudget): Project | null {
    const updateData: any = calculatedBudget ? { ...data, budget: calculatedBudget } : { ...data };
    // Remove budget from data if calculatedBudget is provided separately
    if (calculatedBudget && updateData.budget && updateData.budget !== calculatedBudget) {
      delete updateData.budget;
      updateData.budget = calculatedBudget;
    }
    return persistentDb.projects.update(id, updateData);
  }

  delete(id: string): boolean {
    return persistentDb.projects.delete(id);
  }

  // Resource and expense management (simplified - stored within project budget)
  addResource(projectId: string, resource: ProjectResourceFormData): ProjectResource {
    const project = this.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    const newResource: ProjectResource = {
      ...resource,
      id: `res_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedBudget = {
      ...project.budget,
      resources: [...project.budget.resources, newResource],
    };
    
    this.update(projectId, { budget: updatedBudget });
    return newResource;
  }

  updateResource(projectId: string, resourceId: string, data: Partial<ProjectResourceFormData>): ProjectResource | null {
    const project = this.findById(projectId);
    if (!project) return null;
    
    const updatedResources = project.budget.resources.map(resource =>
      resource.id === resourceId ? { ...resource, ...data } : resource
    );
    
    const updatedBudget = {
      ...project.budget,
      resources: updatedResources,
    };
    
    this.update(projectId, { budget: updatedBudget });
    return updatedResources.find(r => r.id === resourceId) || null;
  }

  removeResource(projectId: string, resourceId: string): boolean {
    const project = this.findById(projectId);
    if (!project) return false;
    
    const updatedResources = project.budget.resources.filter(r => r.id !== resourceId);
    const updatedBudget = {
      ...project.budget,
      resources: updatedResources,
    };
    
    this.update(projectId, { budget: updatedBudget });
    return true;
  }

  addExpense(projectId: string, expense: ProjectExpenseFormData): ProjectExpense {
    const project = this.findById(projectId);
    if (!project) throw new Error('Project not found');
    
    const newExpense: ProjectExpense = {
      ...expense,
      id: `exp_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const updatedBudget = {
      ...project.budget,
      expenses: [...project.budget.expenses, newExpense],
    };
    
    this.update(projectId, { budget: updatedBudget });
    return newExpense;
  }

  updateExpense(projectId: string, expenseId: string, data: Partial<ProjectExpenseFormData>): ProjectExpense | null {
    const project = this.findById(projectId);
    if (!project) return null;
    
    const updatedExpenses = project.budget.expenses.map(expense =>
      expense.id === expenseId ? { ...expense, ...data } : expense
    );
    
    const updatedBudget = {
      ...project.budget,
      expenses: updatedExpenses,
    };
    
    this.update(projectId, { budget: updatedBudget });
    return updatedExpenses.find(e => e.id === expenseId) || null;
  }

  removeExpense(projectId: string, expenseId: string): boolean {
    const project = this.findById(projectId);
    if (!project) return false;
    
    const updatedExpenses = project.budget.expenses.filter(e => e.id !== expenseId);
    const updatedBudget = {
      ...project.budget,
      expenses: updatedExpenses,
    };
    
    this.update(projectId, { budget: updatedBudget });
    return true;
  }

  getStats() {
    const projects = this.findAll();
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      totalRevenue: projects.reduce((sum, p) => sum + p.budget.totalRevenue, 0),
      totalMargin: projects.reduce((sum, p) => sum + p.budget.grossMargin, 0),
      avgMarginPercentage: projects.length > 0 
        ? projects.reduce((sum, p) => sum + p.budget.marginPercentage, 0) / projects.length 
        : 0,
    };
  }
}



// Export service instances
export const browserCompanyService = new BrowserCompanyService();
export const browserContactService = new BrowserContactService();
export const browserDealService = new BrowserDealService();
export const browserProjectService = new BrowserProjectService();

// Re-export time tracking service
export { browserTimeTrackingService } from './timeTrackingService';