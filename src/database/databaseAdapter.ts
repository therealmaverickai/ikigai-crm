// Database adapter that switches between SQLite and localStorage based on environment
import { browserDb } from './browserDatabase';
// import { database as sqliteDb } from './sqliteDatabase';
import type { 
  Company, 
  Contact, 
  Deal, 
  Project,
  TimeEntry,
} from '../types/crm';

export interface DatabaseTable<T extends { id: string; createdAt: Date; updatedAt: Date }> {
  findAll(): T[] | Promise<T[]>;
  findById(id: string): T | null | Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T | Promise<T>;
  update(id: string, data: Partial<T>): T | null | Promise<T | null>;
  delete(id: string): boolean | Promise<boolean>;
  clear(): void | Promise<void>;
}

class DatabaseAdapter {
  public companies: DatabaseTable<Company>;
  public contacts: DatabaseTable<Contact>;
  public deals: DatabaseTable<Deal>;
  public projects: DatabaseTable<Project>;
  public timeEntries: DatabaseTable<TimeEntry>;

  private isServer: boolean;

  constructor() {
    this.isServer = typeof window === 'undefined';
    
    // For now, always use browser database until we set up a backend server
    // In the future, you can uncomment the SQLite part when you have a backend
    
    /*
    if (this.isServer && sqliteDb) {
      console.log('🗄️ Using SQLite database');
      this.companies = sqliteDb.companies;
      this.contacts = sqliteDb.contacts;
      this.deals = sqliteDb.deals;
      this.projects = sqliteDb.projects;
      this.timeEntries = sqliteDb.timeEntries;
    } else {
    */
      console.log('🌐 Using browser localStorage database');
      this.companies = browserDb.companies;
      this.contacts = browserDb.contacts;
      this.deals = browserDb.deals;
      this.projects = browserDb.projects;
      this.timeEntries = browserDb.timeEntries;
    // }
  }

  async initialize(): Promise<void> {
    if (this.isServer) {
      // Initialize SQLite database
      // await sqliteDb?.initialize();
    } else {
      // Initialize browser database
      await browserDb.initialize();
    }
  }

  getStats() {
    return browserDb.getStats();
    // return this.isServer ? sqliteDb?.getStats() : browserDb.getStats();
  }

  exportAllData() {
    return browserDb.exportAllData();
    // return this.isServer ? sqliteDb?.exportAllData() : browserDb.exportAllData();
  }

  importAllData(data: any) {
    return browserDb.importAllData(data);
    // return this.isServer ? sqliteDb?.importAllData(data) : browserDb.importAllData(data);
  }

  clearAllData() {
    return browserDb.clearAllData();
    // return this.isServer ? sqliteDb?.clearAllData() : browserDb.clearAllData();
  }

  // Utility method to ensure all operations return promises for consistency
  private async normalizeResponse<T>(response: T | Promise<T>): Promise<T> {
    return await response;
  }

  // Wrapper methods to normalize responses
  async findAll<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    table: DatabaseTable<T>
  ): Promise<T[]> {
    return this.normalizeResponse(table.findAll());
  }

  async findById<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    table: DatabaseTable<T>,
    id: string
  ): Promise<T | null> {
    return this.normalizeResponse(table.findById(id));
  }

  async create<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    table: DatabaseTable<T>,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<T> {
    return this.normalizeResponse(table.create(data));
  }

  async update<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    table: DatabaseTable<T>,
    id: string,
    data: Partial<T>
  ): Promise<T | null> {
    return this.normalizeResponse(table.update(id, data));
  }

  async deleteRecord<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    table: DatabaseTable<T>,
    id: string
  ): Promise<boolean> {
    return this.normalizeResponse(table.delete(id));
  }

  async clear<T extends { id: string; createdAt: Date; updatedAt: Date }>(
    table: DatabaseTable<T>
  ): Promise<void> {
    return this.normalizeResponse(table.clear());
  }
}

// Export a singleton instance
export const db = new DatabaseAdapter();
export default DatabaseAdapter;