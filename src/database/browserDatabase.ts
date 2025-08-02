// Browser-compatible database implementation using localStorage with structured data
import type { 
  Company, 
  Contact, 
  Deal, 
  Project,
  TimeEntry,
} from '../types/crm';

export interface DatabaseTable<T extends { id: string; createdAt: Date; updatedAt: Date }> {
  findAll(): T[];
  findById(id: string): T | null;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T;
  update(id: string, data: Partial<T>): T | null;
  delete(id: string): boolean;
  clear(): void;
}

class LocalStorageTable<T extends { id: string; createdAt: Date; updatedAt: Date }> implements DatabaseTable<T> {
  constructor(private tableName: string) {}

  private getKey(): string {
    return `crm_${this.tableName}`;
  }

  private generateId() {
    return `${this.tableName}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
  }

  private loadData(): T[] {
    const data = localStorage.getItem(this.getKey());
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        // Handle date fields in specific tables
        ...(item.expectedCloseDate && { expectedCloseDate: new Date(item.expectedCloseDate) }),
        ...(item.actualCloseDate && { actualCloseDate: new Date(item.actualCloseDate) }),
        ...(item.startDate && { startDate: new Date(item.startDate) }),
        ...(item.endDate && { endDate: new Date(item.endDate) }),
        ...(item.actualStartDate && { actualStartDate: new Date(item.actualStartDate) }),
        ...(item.actualEndDate && { actualEndDate: new Date(item.actualEndDate) }),
        ...(item.dueDate && { dueDate: new Date(item.dueDate) }),
        ...(item.validUntil && { validUntil: new Date(item.validUntil) }),
        ...(item.approvedAt && { approvedAt: new Date(item.approvedAt) }),
        // Handle time entry date fields
        ...(item.startTime && { startTime: new Date(item.startTime) }),
        ...(item.endTime && { endTime: new Date(item.endTime) }),
        ...(item.date && { date: new Date(item.date) }),
      }));
    } catch (error) {
      console.error(`Failed to load data for table ${this.tableName}:`, error);
      return [];
    }
  }

  private saveData(data: T[]): void {
    try {
      localStorage.setItem(this.getKey(), JSON.stringify(data));
    } catch (error) {
      console.error(`Failed to save data for table ${this.tableName}:`, error);
      throw new Error(`Storage quota exceeded or other localStorage error`);
    }
  }

  findAll(): T[] {
    return this.loadData();
  }

  findById(id: string): T | null {
    const data = this.loadData();
    return data.find(item => item.id === id) || null;
  }

  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const allData = this.loadData();
    const now = new Date();
    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;
    
    allData.push(newItem);
    this.saveData(allData);
    return newItem;
  }

  update(id: string, data: Partial<T>): T | null {
    const allData = this.loadData();
    const index = allData.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = {
      ...allData[index],
      ...data,
      updatedAt: new Date(),
    } as T;
    
    allData[index] = updatedItem;
    this.saveData(allData);
    return updatedItem;
  }

  delete(id: string): boolean {
    const allData = this.loadData();
    const initialLength = allData.length;
    const filteredData = allData.filter(item => item.id !== id);
    
    if (filteredData.length < initialLength) {
      this.saveData(filteredData);
      return true;
    }
    return false;
  }

  clear(): void {
    localStorage.removeItem(this.getKey());
  }

  // Query methods
  findWhere(predicate: (item: T) => boolean): T[] {
    return this.loadData().filter(predicate);
  }
}

// Database class that manages all tables
export class BrowserDatabase {
  public companies: DatabaseTable<Company>;
  public contacts: DatabaseTable<Contact>;
  public deals: DatabaseTable<Deal>;
  public projects: DatabaseTable<Project>;
  public timeEntries: DatabaseTable<TimeEntry>;

  constructor() {
    this.companies = new LocalStorageTable<Company>('companies');
    this.contacts = new LocalStorageTable<Contact>('contacts');
    this.deals = new LocalStorageTable<Deal>('deals');
    this.projects = new LocalStorageTable<Project>('projects');
    this.timeEntries = new LocalStorageTable<TimeEntry>('timeEntries');
  }

  // Initialize with schema validation (simplified)
  async initialize(): Promise<void> {
    console.log('🌐 Initializing browser database with localStorage');
    
    // Check localStorage availability
    if (typeof Storage === "undefined") {
      throw new Error('localStorage is not supported in this browser');
    }
    
    // Check available storage space
    try {
      const testKey = 'storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.error('localStorage is not available:', error);
      throw new Error('localStorage is not available');
    }
    
    console.log('✅ Browser database initialized successfully');
  }

  // Database maintenance methods
  getStorageInfo() {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('crm_'));
    const totalSize = keys.reduce((total, key) => {
      const data = localStorage.getItem(key);
      return total + (data ? data.length : 0);
    }, 0);
    
    return {
      tables: keys.length,
      totalSizeBytes: totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      companies: this.companies.findAll().length,
      contacts: this.contacts.findAll().length,
      deals: this.deals.findAll().length,
      projects: this.projects.findAll().length,
      timeEntries: this.timeEntries.findAll().length,
    };
  }

  exportAllData() {
    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      companies: this.companies.findAll(),
      contacts: this.contacts.findAll(),
      deals: this.deals.findAll(),
      projects: this.projects.findAll(),
      timeEntries: this.timeEntries.findAll(),
    };
  }

  importAllData(data: any) {
    // Clear existing data
    this.companies.clear();
    this.contacts.clear();
    this.deals.clear();
    this.projects.clear();
    this.timeEntries.clear();
    
    // Import new data
    if (data.companies) {
      data.companies.forEach((company: any) => {
        this.companies.create(company);
      });
    }
    
    if (data.contacts) {
      data.contacts.forEach((contact: any) => {
        this.contacts.create(contact);
      });
    }
    
    if (data.deals) {
      data.deals.forEach((deal: any) => {
        this.deals.create(deal);
      });
    }
    
    if (data.projects) {
      data.projects.forEach((project: any) => {
        this.projects.create(project);
      });
    }
    
    
    if (data.timeEntries) {
      data.timeEntries.forEach((timeEntry: any) => {
        this.timeEntries.create(timeEntry);
      });
    }
    
  }

  clearAllData() {
    this.companies.clear();
    this.contacts.clear();
    this.deals.clear();
    this.projects.clear();
    this.timeEntries.clear();
    console.log('🗑️ All CRM data cleared');
  }
}

// Export singleton instance
export const browserDb = new BrowserDatabase();