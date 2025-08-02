// Environment detection and database initialization
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
const isBrowser = typeof window !== 'undefined';

let db: any = null;
let storage: any = null;

export const initializeDatabase = async (): Promise<any> => {
  if (db || storage) {
    return db || storage;
  }

  try {
    if (isNode) {
      // Node.js environment - use SQLite
      const Database = require('better-sqlite3');
      const { readFileSync } = require('fs');
      const { join } = require('path');
      
      const dbPath = join(process.cwd(), 'crm-data.db');
      db = new Database(dbPath);
      
      // Enable foreign keys
      db.pragma('foreign_keys = ON');
      
      // Read and execute schema
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      
      // Execute schema statements
      const statements = schema.split(';').filter((stmt: string) => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          db.exec(statement);
        }
      }
      
      console.log('✅ SQLite database initialized successfully at:', dbPath);
      return db;
      
    } else if (isBrowser) {
      // Browser environment - use IndexedDB/localStorage
      const { browserStorage } = await import('./browserStorage');
      storage = browserStorage;
      
      if (storage.init) {
        await storage.init();
      }
      
      console.log('✅ Browser storage initialized successfully');
      return storage;
      
    } else {
      throw new Error('Unknown environment - neither Node.js nor browser detected');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    
    // Fallback to in-memory storage
    console.warn('🔄 Falling back to in-memory storage');
    storage = {
      data: new Map(),
      get: (table: string, id?: string) => {
        const tableData = storage.data.get(table) || new Map();
        return id ? tableData.get(id) : Array.from(tableData.values());
      },
      set: (table: string, id: string, data: any) => {
        if (!storage.data.has(table)) {
          storage.data.set(table, new Map());
        }
        storage.data.get(table).set(id, data);
      },
      delete: (table: string, id: string) => {
        const tableData = storage.data.get(table);
        return tableData ? tableData.delete(id) : false;
      },
      clear: (table: string) => {
        storage.data.set(table, new Map());
      }
    };
    
    return storage;
  }
};

export const getDatabase = (): any => {
  if (db) return db;
  if (storage) return storage;
  throw new Error('Database not initialized. Call initializeDatabase() first.');
};

export const closeDatabase = (): void => {
  if (db && db.close) {
    db.close();
    db = null;
    console.log('✅ Database connection closed');
  }
  if (storage) {
    storage = null;
    console.log('✅ Storage connection closed');
  }
};

// Graceful shutdown (Node.js only)
if (isNode) {
  process.on('exit', closeDatabase);
  process.on('SIGINT', () => {
    closeDatabase();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    closeDatabase();
    process.exit(0);
  });
}