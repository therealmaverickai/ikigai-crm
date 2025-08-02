// Enhanced localStorage implementation with better persistence and backup
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

class PersistentStorageTable<T extends { id: string; createdAt: Date; updatedAt: Date }> implements DatabaseTable<T> {
  constructor(private tableName: string) {}

  private getKey(): string {
    return `crm_${this.tableName}`;
  }

  private getBackupKey(): string {
    return `crm_backup_${this.tableName}`;
  }

  private generateId(): string {
    return `${this.tableName}_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString(36)}`;
  }

  private loadData(): T[] {
    try {
      // Try to load from primary storage
      const data = localStorage.getItem(this.getKey());
      if (data) {
        const parsed = JSON.parse(data);
        const entities = parsed.map((item: any) => this.mapToEntity(item));
        // Create backup after successful load
        this.createBackup(entities);
        return entities;
      }

      // Try to load from backup if primary fails
      const backupData = localStorage.getItem(this.getBackupKey());
      if (backupData) {
        console.warn(`Primary storage for ${this.tableName} failed, loading from backup`);
        const parsed = JSON.parse(backupData);
        return parsed.map((item: any) => this.mapToEntity(item));
      }

      return [];
    } catch (error) {
      console.error(`Error loading data for ${this.tableName}:`, error);
      
      // Try backup if primary storage is corrupted
      try {
        const backupData = localStorage.getItem(this.getBackupKey());
        if (backupData) {
          console.warn(`Primary storage corrupted for ${this.tableName}, loading from backup`);
          const parsed = JSON.parse(backupData);
          return parsed.map((item: any) => this.mapToEntity(item));
        }
      } catch (backupError) {
        console.error(`Backup storage also corrupted for ${this.tableName}:`, backupError);
      }
      
      return [];
    }
  }

  private saveData(data: T[]): void {
    try {
      const serialized = JSON.stringify(data, null, 0);
      localStorage.setItem(this.getKey(), serialized);
      
      // Create backup with a slight delay to avoid blocking
      setTimeout(() => this.createBackup(data), 100);
    } catch (error) {
      console.error(`Error saving data for ${this.tableName}:`, error);
      
      // Try to free up space by cleaning old backups
      this.cleanupOldBackups();
      
      // Retry once
      try {
        const serialized = JSON.stringify(data, null, 0);
        localStorage.setItem(this.getKey(), serialized);
      } catch (retryError) {
        console.error(`Failed to save data even after cleanup for ${this.tableName}:`, retryError);
        throw new Error(`Failed to persist data for ${this.tableName}`);
      }
    }
  }

  private createBackup(data: T[]): void {
    try {
      const serialized = JSON.stringify(data, null, 0);
      localStorage.setItem(this.getBackupKey(), serialized);
    } catch (error) {
      console.warn(`Failed to create backup for ${this.tableName}:`, error);
    }
  }

  private cleanupOldBackups(): void {
    try {
      // Remove old backup entries to free up space
      const keys = Object.keys(localStorage);
      const oldBackupKeys = keys.filter(key => 
        key.startsWith('crm_backup_') && key !== this.getBackupKey()
      );
      
      oldBackupKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  private mapToEntity(item: any): T {
    return {
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      // Handle date fields in specific tables
      ...(item.expectedCloseDate && { expectedCloseDate: new Date(item.expectedCloseDate) }),
      ...(item.actualCloseDate && { actualCloseDate: new Date(item.actualCloseDate) }),
      ...(item.convertedToProjectAt && { convertedToProjectAt: new Date(item.convertedToProjectAt) }),
      ...(item.startDate && { startDate: new Date(item.startDate) }),
      ...(item.endDate && { endDate: new Date(item.endDate) }),
      ...(item.actualStartDate && { actualStartDate: new Date(item.actualStartDate) }),
      ...(item.actualEndDate && { actualEndDate: new Date(item.actualEndDate) }),
      ...(item.dueDate && { dueDate: new Date(item.dueDate) }),
      ...(item.completedDate && { completedDate: new Date(item.completedDate) }),
      // Handle array fields
      ...(item.tags && { tags: Array.isArray(item.tags) ? item.tags : [] }),
      ...(item.skills && { skills: Array.isArray(item.skills) ? item.skills : [] }),
      ...(item.milestones && { milestones: Array.isArray(item.milestones) ? item.milestones : [] }),
      ...(item.deliverables && { deliverables: Array.isArray(item.deliverables) ? item.deliverables : [] }),
      ...(item.dependencies && { dependencies: Array.isArray(item.dependencies) ? item.dependencies : [] }),
    } as T;
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

    const updated = {
      ...allData[index],
      ...data,
      updatedAt: new Date(),
    } as T;

    allData[index] = updated;
    this.saveData(allData);
    return updated;
  }

  delete(id: string): boolean {
    const allData = this.loadData();
    const initialLength = allData.length;
    const filtered = allData.filter(item => item.id !== id);
    
    if (filtered.length === initialLength) return false;

    this.saveData(filtered);
    return true;
  }

  clear(): void {
    try {
      localStorage.removeItem(this.getKey());
      localStorage.removeItem(this.getBackupKey());
    } catch (error) {
      console.error(`Error clearing data for ${this.tableName}:`, error);
    }
  }
}

class PersistentDatabase {
  public companies: DatabaseTable<Company>;
  public contacts: DatabaseTable<Contact>;
  public deals: DatabaseTable<Deal>;
  public projects: DatabaseTable<Project>;
  public timeEntries: DatabaseTable<TimeEntry>;
  
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private lastAutoSave: Date | null = null;

  constructor() {
    this.companies = new PersistentStorageTable<Company>('companies');
    this.contacts = new PersistentStorageTable<Contact>('contacts');
    this.deals = new PersistentStorageTable<Deal>('deals');
    this.projects = new PersistentStorageTable<Project>('projects');
    this.timeEntries = new PersistentStorageTable<TimeEntry>('time_entries');
  }

  async initialize(): Promise<void> {
    console.log('🗄️ Initializing persistent database with enhanced localStorage');
    
    // Check storage availability and size
    this.checkStorageHealth();
    
    // Start auto-save every 5 minutes
    this.startAutoSave();
  }

  private checkStorageHealth(): void {
    try {
      // Check if localStorage is available
      const testKey = 'crm_storage_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      // Estimate storage usage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith('crm_')) {
          totalSize += localStorage[key].length;
        }
      }

      console.log(`📊 Storage health check: ${(totalSize / 1024).toFixed(2)} KB used`);
      
      // Warn if approaching storage limits (assume 5MB limit)
      if (totalSize > 4 * 1024 * 1024) {
        console.warn('⚠️ Storage usage is high, consider implementing data archiving');
      }

    } catch (error) {
      console.error('Storage health check failed:', error);
    }
  }

  getStats() {
    return {
      companies: this.companies.findAll().length,
      contacts: this.contacts.findAll().length,
      deals: this.deals.findAll().length,
      projects: this.projects.findAll().length,
      timeEntries: this.timeEntries.findAll().length,
    };
  }

  clearAllData(): void {
    console.log('🗑️ Clearing all persistent data...');
    this.companies.clear();
    this.contacts.clear();
    this.deals.clear();
    this.projects.clear();
    this.timeEntries.clear();
    console.log('✅ All persistent data cleared');
  }

  recoverFromBackup(): boolean {
    console.log('🔄 Attempting to recover data from backup...');
    let recovered = false;
    
    try {
      // Try to recover from backup storage
      const backupKeys = ['companies', 'contacts', 'deals', 'projects', 'time_entries'];
      
      for (const key of backupKeys) {
        const backupData = localStorage.getItem(`crm_backup_${key}`);
        if (backupData) {
          localStorage.setItem(`crm_${key}`, backupData);
          console.log(`✅ Recovered ${key} from backup`);
          recovered = true;
        }
      }
      
      if (recovered) {
        console.log('✅ Data recovery completed');
        return true;
      } else {
        console.log('⚠️ No backup data found to recover');
        return false;
      }
    } catch (error) {
      console.error('❌ Error during data recovery:', error);
      return false;
    }
  }

  exportAllData() {
    return {
      companies: this.companies.findAll(),
      contacts: this.contacts.findAll(),
      deals: this.deals.findAll(),
      projects: this.projects.findAll(),
      timeEntries: this.timeEntries.findAll(),
      timestamp: new Date().toISOString(),
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

    console.log('✅ Data import completed');
  }


  // Export data as downloadable JSON file
  exportToFile(): void {
    try {
      const data = this.exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📁 Data exported to file');
    } catch (error) {
      console.error('Failed to export data to file:', error);
    }
  }

  // Auto-save functionality for localStorage
  startAutoSave(intervalMinutes: number = 5): void {
    this.stopAutoSave(); // Clear any existing interval
    
    console.log(`🔄 Starting localStorage auto-save (every ${intervalMinutes} minutes)`);
    
    this.autoSaveInterval = setInterval(() => {
      this.performAutoSave();
    }, intervalMinutes * 60 * 1000);
    
    // Perform initial save
    this.performAutoSave();
  }

  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('⏸️ localStorage auto-save stopped');
    }
  }

  private performAutoSave(): void {
    try {
      // Create a timestamp for this save
      const now = new Date();
      const timestamp = now.toISOString();
      
      // Save timestamp to track last auto-save
      localStorage.setItem('crm_last_autosave', timestamp);
      this.lastAutoSave = now;
      
      // Force a backup creation for all tables
      this.companies.findAll(); // This triggers backup creation
      this.contacts.findAll();
      this.deals.findAll();
      this.projects.findAll();
      this.timeEntries.findAll();
      
      console.log(`💾 Auto-save completed at ${now.toLocaleTimeString()}`);
      
      // Show brief notification if in browser
      if (typeof window !== 'undefined' && window.document) {
        this.showAutoSaveNotification();
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
  }

  private showAutoSaveNotification(): void {
    // Create a subtle notification
    const notification = document.createElement('div');
    notification.innerHTML = '💾 Auto-saved';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10B981;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Fade in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);
    
    // Fade out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  getAutoSaveInfo(): { isEnabled: boolean; lastSave: Date | null; intervalMinutes: number } {
    const lastSaveStr = localStorage.getItem('crm_last_autosave');
    const lastSave = lastSaveStr ? new Date(lastSaveStr) : null;
    
    return {
      isEnabled: this.autoSaveInterval !== null,
      lastSave: lastSave,
      intervalMinutes: 5 // Currently fixed at 5 minutes
    };
  }
}

// Export singleton instance
export const persistentDb = new PersistentDatabase();
export default persistentDb;