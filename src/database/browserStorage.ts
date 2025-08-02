// Browser-compatible storage layer using IndexedDB
// This provides a fallback when SQLite isn't available

interface StorageAdapter {
  get<T>(table: string, id?: string): Promise<T | T[]>;
  set<T>(table: string, id: string, data: T): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  clear(table: string): Promise<void>;
  query<T>(table: string, filter?: (item: T) => boolean): Promise<T[]>;
}

class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'CrmDatabase';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each table
        const tables = ['companies', 'contacts', 'deals', 'projects', 'project_resources', 'project_expenses'];
        
        tables.forEach(tableName => {
          if (!db.objectStoreNames.contains(tableName)) {
            const store = db.createObjectStore(tableName, { keyPath: 'id' });
            
            // Create indexes for common queries
            if (tableName === 'contacts') {
              store.createIndex('companyId', 'companyId', { unique: false });
            }
            if (tableName === 'deals') {
              store.createIndex('companyId', 'companyId', { unique: false });
              store.createIndex('stage', 'stage', { unique: false });
            }
            if (tableName === 'projects') {
              store.createIndex('companyId', 'companyId', { unique: false });
              store.createIndex('dealId', 'dealId', { unique: false });
            }
          }
        });
      };
    });
  }

  async get<T>(table: string, id?: string): Promise<T | T[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(table, 'readonly');
      const store = transaction.objectStore(table);
      
      if (id) {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }

  async set<T>(table: string, id: string, data: T): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.put({ ...data, id });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(table: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(table: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(table, 'readwrite');
      const store = transaction.objectStore(table);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async query<T>(table: string, filter?: (item: T) => boolean): Promise<T[]> {
    const items = await this.get<T[]>(table) as T[];
    return filter ? items.filter(filter) : items;
  }
}

class LocalStorageAdapter implements StorageAdapter {
  private getKey(table: string, id?: string): string {
    return id ? `crm_${table}_${id}` : `crm_${table}`;
  }

  private getAllKeys(table: string): string[] {
    const prefix = `crm_${table}_`;
    return Object.keys(localStorage).filter(key => key.startsWith(prefix));
  }

  async get<T>(table: string, id?: string): Promise<T | T[]> {
    if (id) {
      const data = localStorage.getItem(this.getKey(table, id));
      return data ? JSON.parse(data) : null;
    } else {
      const keys = this.getAllKeys(table);
      return keys.map(key => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }).filter(item => item !== null);
    }
  }

  async set<T>(table: string, id: string, data: T): Promise<void> {
    localStorage.setItem(this.getKey(table, id), JSON.stringify(data));
  }

  async delete(table: string, id: string): Promise<void> {
    localStorage.removeItem(this.getKey(table, id));
  }

  async clear(table: string): Promise<void> {
    const keys = this.getAllKeys(table);
    keys.forEach(key => localStorage.removeItem(key));
  }

  async query<T>(table: string, filter?: (item: T) => boolean): Promise<T[]> {
    const items = await this.get<T[]>(table) as T[];
    return filter ? items.filter(filter) : items;
  }
}

// Create storage adapter based on browser capabilities
export const createStorageAdapter = (): StorageAdapter => {
  if (typeof window !== 'undefined' && window.indexedDB) {
    return new IndexedDBAdapter();
  } else if (typeof window !== 'undefined' && window.localStorage) {
    console.warn('IndexedDB not available, falling back to localStorage');
    return new LocalStorageAdapter();
  } else {
    throw new Error('No storage mechanism available');
  }
};

// Export singleton instance
export const browserStorage = createStorageAdapter();