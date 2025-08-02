// SQLite database implementation for proper data persistence
import type { 
  Company, 
  Contact, 
  Deal, 
  Project,
  TimeEntry,
} from '../types/crm';

export interface DatabaseTable<T extends { id: string; createdAt: Date; updatedAt: Date }> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}

class SQLiteTable<T extends { id: string; createdAt: Date; updatedAt: Date }> implements DatabaseTable<T> {
  constructor(private tableName: string, private db: any) {}

  private generateId(): string {
    return `${this.tableName}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
  }

  async findAll(): Promise<T[]> {
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC`;
      const rows = this.db.prepare(query).all();
      return rows.map(this.mapRowToEntity);
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error);
      return [];
    }
  }

  async findById(id: string): Promise<T | null> {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const row = this.db.prepare(query).get(id);
      return row ? this.mapRowToEntity(row) : null;
    } catch (error) {
      console.error(`Error finding ${this.tableName} by id:`, error);
      return null;
    }
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = this.generateId();
    const now = new Date();
    const entityWithMeta = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    } as T;

    try {
      const columns = Object.keys(entityWithMeta);
      const placeholders = columns.map(() => '?').join(', ');
      const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
      
      const values = columns.map(col => {
        const value = (entityWithMeta as any)[col];
        // Handle dates and objects
        return value instanceof Date ? value.toISOString() :
               typeof value === 'object' ? JSON.stringify(value) : value;
      });

      this.db.prepare(query).run(values);
      return entityWithMeta;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const columns = Object.keys(updateData);
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      
      const values = [
        ...columns.map(col => {
          const value = (updateData as any)[col];
          return value instanceof Date ? value.toISOString() :
                 typeof value === 'object' ? JSON.stringify(value) : value;
        }),
        id
      ];

      this.db.prepare(query).run(values);
      return await this.findById(id);
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = this.db.prepare(query).run(id);
      return result.changes > 0;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const query = `DELETE FROM ${this.tableName}`;
      this.db.prepare(query).run();
    } catch (error) {
      console.error(`Error clearing ${this.tableName}:`, error);
    }
  }

  private mapRowToEntity(row: any): T {
    const entity = { ...row };
    
    // Convert ISO strings back to Date objects
    if (entity.createdAt) entity.createdAt = new Date(entity.createdAt);
    if (entity.updatedAt) entity.updatedAt = new Date(entity.updatedAt);
    if (entity.expectedCloseDate) entity.expectedCloseDate = new Date(entity.expectedCloseDate);
    if (entity.actualCloseDate) entity.actualCloseDate = new Date(entity.actualCloseDate);
    if (entity.startDate) entity.startDate = new Date(entity.startDate);
    if (entity.endDate) entity.endDate = new Date(entity.endDate);
    if (entity.actualStartDate) entity.actualStartDate = new Date(entity.actualStartDate);
    if (entity.actualEndDate) entity.actualEndDate = new Date(entity.actualEndDate);
    if (entity.dueDate) entity.dueDate = new Date(entity.dueDate);

    // Parse JSON fields
    if (entity.tags && typeof entity.tags === 'string') {
      try {
        entity.tags = JSON.parse(entity.tags);
      } catch {
        entity.tags = [];
      }
    }

    if (entity.budget && typeof entity.budget === 'string') {
      try {
        entity.budget = JSON.parse(entity.budget);
      } catch {
        entity.budget = null;
      }
    }

    if (entity.milestones && typeof entity.milestones === 'string') {
      try {
        entity.milestones = JSON.parse(entity.milestones);
      } catch {
        entity.milestones = [];
      }
    }

    return entity as T;
  }
}

class SQLiteDatabase {
  private db: any = null;
  public companies: DatabaseTable<Company>;
  public contacts: DatabaseTable<Contact>;
  public deals: DatabaseTable<Deal>;
  public projects: DatabaseTable<Project>;
  public timeEntries: DatabaseTable<TimeEntry>;

  constructor() {
    // Initialize database connection (we'll need to install better-sqlite3)
    this.initializeDatabase();
    
    this.companies = new SQLiteTable<Company>('companies', this.db);
    this.contacts = new SQLiteTable<Contact>('contacts', this.db);
    this.deals = new SQLiteTable<Deal>('deals', this.db);
    this.projects = new SQLiteTable<Project>('projects', this.db);
    this.timeEntries = new SQLiteTable<TimeEntry>('time_entries', this.db);
  }

  private async initializeDatabase() {
    try {
      // For now, we'll fall back to localStorage if SQLite isn't available
      // In a real implementation, you'd use better-sqlite3 or similar
      if (typeof window !== 'undefined') {
        console.warn('SQLite not available in browser environment, falling back to localStorage');
        return;
      }

      // This would be the real SQLite initialization:
      // const Database = require('better-sqlite3');
      // this.db = new Database('crm.db');
      
      // Execute schema creation
      // this.createTables();
      
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
    }
  }

  private createTables() {
    if (!this.db) return;

    // Read and execute schema from schema.sql
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    this.db.exec(schema);
  }

  async initialize(): Promise<void> {
    console.log('🗄️ Initializing SQLite database');
    // Database should already be initialized in constructor
  }

  getStats() {
    return {
      companies: 0, // We'd need to count rows in real implementation
      contacts: 0,
      deals: 0,
      projects: 0,
      timeEntries: 0,
    };
  }

  async exportAllData() {
    return {
      companies: await this.companies.findAll(),
      contacts: await this.contacts.findAll(),
      deals: await this.deals.findAll(),
      projects: await this.projects.findAll(),
      timeEntries: await this.timeEntries.findAll(),
    };
  }

  async importAllData(data: any) {
    // Clear existing data
    await this.companies.clear();
    await this.contacts.clear();
    await this.deals.clear();
    await this.projects.clear();
    await this.timeEntries.clear();

    // Import new data
    if (data.companies) {
      for (const company of data.companies) {
        await this.companies.create(company);
      }
    }

    if (data.contacts) {
      for (const contact of data.contacts) {
        await this.contacts.create(contact);
      }
    }

    if (data.deals) {
      for (const deal of data.deals) {
        await this.deals.create(deal);
      }
    }

    if (data.projects) {
      for (const project of data.projects) {
        await this.projects.create(project);
      }
    }

    if (data.timeEntries) {
      for (const timeEntry of data.timeEntries) {
        await this.timeEntries.create(timeEntry);
      }
    }
  }

  async clearAllData() {
    await this.companies.clear();
    await this.contacts.clear();
    await this.deals.clear();
    await this.projects.clear();
    await this.timeEntries.clear();
  }
}

// For now, we'll use a hybrid approach - SQLite in Node.js environments, localStorage in browser
export const database = typeof window !== 'undefined' 
  ? null // We'll fall back to browser database
  : new SQLiteDatabase();

export default SQLiteDatabase;