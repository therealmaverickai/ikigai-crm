// File-based storage service that replaces localStorage
import { localFileStorage, type CRMData } from '../fileStorage';
import type { 
  Company, 
  Contact, 
  Deal, 
  Project,
  TimeEntry,
  CompanyFormData, 
  ContactFormData, 
  DealFormData,
  ProjectFormData,
  ProjectBudget,
  CompanyFilters, 
  ContactFilters,
  DealFilters,
  ProjectFilters,
} from '../../types/crm';

// Base service class for file-based entities
abstract class FileEntityService<T extends { id: string; createdAt: Date; updatedAt: Date }> {
  protected abstract entityName: keyof CRMData;
  private data: T[] = [];

  constructor() {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const fileData = await localFileStorage.loadFromFile();
      if (fileData && this.entityName in fileData) {
        this.data = (fileData[this.entityName] as T[]).map(item => this.mapFromJSON(item));
      }
    } catch (error) {
      console.error(`Failed to load ${this.entityName} from file:`, error);
      this.data = [];
    }
  }

  private async saveData(): Promise<void> {
    try {
      // Get all current data
      const currentData = await this.getAllCurrentData();
      await localFileStorage.saveToFile(currentData);
    } catch (error) {
      console.error(`Failed to save ${this.entityName} to file:`, error);
    }
  }

  private async getAllCurrentData(): Promise<CRMData> {
    // This should be implemented to gather all data from all services
    // For now, we'll create a basic structure
    return {
      companies: this.entityName === 'companies' ? this.data as Company[] : [],
      contacts: this.entityName === 'contacts' ? this.data as Contact[] : [],
      deals: this.entityName === 'deals' ? this.data as Deal[] : [],
      projects: this.entityName === 'projects' ? this.data as Project[] : [],
      timeEntries: this.entityName === 'timeEntries' ? this.data as TimeEntry[] : [],
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // Convert JSON data to proper entity (handle dates, etc.)
  protected mapFromJSON(item: any): T {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      // Handle specific date fields
      ...(item.expectedCloseDate && { expectedCloseDate: new Date(item.expectedCloseDate) }),
      ...(item.actualCloseDate && { actualCloseDate: new Date(item.actualCloseDate) }),
      ...(item.convertedToProjectAt && { convertedToProjectAt: new Date(item.convertedToProjectAt) }),
      ...(item.startDate && { startDate: new Date(item.startDate) }),
      ...(item.endDate && { endDate: new Date(item.endDate) }),
    } as T;
  }

  // Base CRUD operations
  findAll(): T[] {
    return [...this.data];
  }

  findById(id: string): T | null {
    return this.data.find(item => item.id === id) || null;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const newItem: T = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    this.data.push(newItem);
    await this.saveData();
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem: T = {
      ...this.data[index],
      ...data,
      updatedAt: new Date(),
    };

    this.data[index] = updatedItem;
    await this.saveData();
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => item.id !== id);
    
    if (this.data.length < initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  clear(): void {
    this.data = [];
  }

  private generateId(): string {
    return `${this.entityName}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
  }
}

// Company Service
export class FileCompanyService extends FileEntityService<Company> {
  protected entityName: keyof CRMData = 'companies';

  findFiltered(filters: CompanyFilters): Company[] {
    return this.findAll().filter((company) => {
      const matchesSearch = !filters.search || 
        company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        company.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || company.status === filters.status;
      const matchesIndustry = !filters.industry || company.industry === filters.industry;
      const matchesSize = !filters.size || company.size === filters.size;
      
      return matchesSearch && matchesStatus && matchesIndustry && matchesSize;
    });
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
export class FileContactService extends FileEntityService<Contact> {
  protected entityName: keyof CRMData = 'contacts';

  findByCompany(companyId: string): Contact[] {
    return this.findAll().filter(c => c.companyId === companyId);
  }

  findFiltered(filters: ContactFilters): Contact[] {
    return this.findAll().filter((contact) => {
      const matchesSearch = !filters.search || 
        contact.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        contact.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCompany = !filters.companyId || contact.companyId === filters.companyId;
      const matchesStatus = !filters.status || contact.status === filters.status;
      
      return matchesSearch && matchesCompany && matchesStatus;
    });
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
export class FileDealService extends FileEntityService<Deal> {
  protected entityName: keyof CRMData = 'deals';

  findByCompany(companyId: string): Deal[] {
    return this.findAll().filter(d => d.companyId === companyId);
  }

  findFiltered(filters: DealFilters): Deal[] {
    return this.findAll().filter((deal) => {
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
export class FileProjectService extends FileEntityService<Project> {
  protected entityName: keyof CRMData = 'projects';

  findByCompany(companyId: string): Project[] {
    return this.findAll().filter(p => p.companyId === companyId);
  }

  findFiltered(filters: ProjectFilters): Project[] {
    return this.findAll().filter((project) => {
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
export const fileCompanyService = new FileCompanyService();
export const fileContactService = new FileContactService();
export const fileDealService = new FileDealService();
export const fileProjectService = new FileProjectService();