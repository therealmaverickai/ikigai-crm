import { getDatabase } from '../connection';
import type { Contact, ContactFormData, ContactFilters } from '../../types/crm';

export class ContactService {
  private db = getDatabase();

  // Create
  create(data: ContactFormData): Contact {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    // If this contact is being set as primary, remove primary from others in same company
    if (data.isPrimary) {
      this.removePrimaryFromCompany(data.companyId);
    }
    
    const stmt = this.db.prepare(`
      INSERT INTO contacts (
        id, company_id, first_name, last_name, email, phone, job_title, 
        department, is_primary, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, data.companyId, data.firstName, data.lastName, data.email, data.phone,
      data.jobTitle, data.department, data.isPrimary ? 1 : 0, data.notes, 
      data.status, now, now
    );
    
    return this.findById(id)!;
  }

  // Read
  findAll(): Contact[] {
    const stmt = this.db.prepare(`
      SELECT id, company_id as companyId, first_name as firstName, 
             last_name as lastName, email, phone, job_title as jobTitle, 
             department, is_primary as isPrimary, notes, status, 
             created_at, updated_at 
      FROM contacts 
      ORDER BY created_at DESC
    `);
    
    return stmt.all().map(this.mapRow);
  }

  findById(id: string): Contact | null {
    const stmt = this.db.prepare(`
      SELECT id, company_id as companyId, first_name as firstName, 
             last_name as lastName, email, phone, job_title as jobTitle, 
             department, is_primary as isPrimary, notes, status, 
             created_at, updated_at 
      FROM contacts 
      WHERE id = ?
    `);
    
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  findByCompany(companyId: string): Contact[] {
    const stmt = this.db.prepare(`
      SELECT id, company_id as companyId, first_name as firstName, 
             last_name as lastName, email, phone, job_title as jobTitle, 
             department, is_primary as isPrimary, notes, status, 
             created_at, updated_at 
      FROM contacts 
      WHERE company_id = ?
      ORDER BY is_primary DESC, created_at DESC
    `);
    
    return stmt.all(companyId).map(this.mapRow);
  }

  findFiltered(filters: ContactFilters): Contact[] {
    let query = `
      SELECT id, company_id as companyId, first_name as firstName, 
             last_name as lastName, email, phone, job_title as jobTitle, 
             department, is_primary as isPrimary, notes, status, 
             created_at, updated_at 
      FROM contacts 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.companyId) {
      query += ` AND company_id = ?`;
      params.push(filters.companyId);
    }

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY is_primary DESC, created_at DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params).map(this.mapRow);
  }

  // Update
  update(id: string, data: Partial<ContactFormData>): Contact | null {
    const contact = this.findById(id);
    if (!contact) return null;

    // If setting as primary, remove primary from others in same company
    if (data.isPrimary) {
      this.removePrimaryFromCompany(contact.companyId, id);
    }

    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        let dbKey = key;
        let dbValue = value;
        
        // Handle camelCase to snake_case conversion
        switch (key) {
          case 'companyId': dbKey = 'company_id'; break;
          case 'firstName': dbKey = 'first_name'; break;
          case 'lastName': dbKey = 'last_name'; break;
          case 'jobTitle': dbKey = 'job_title'; break;
          case 'isPrimary': dbKey = 'is_primary'; dbValue = value ? 1 : 0; break;
        }
        
        fields.push(`${dbKey} = ?`);
        params.push(dbValue);
      }
    });

    if (fields.length === 0) {
      return contact;
    }

    params.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE contacts 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findById(id);
  }

  // Delete
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Helper methods
  private generateId(): string {
    return 'cont_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private mapRow(row: any): Contact {
    return {
      ...row,
      isPrimary: Boolean(row.isPrimary),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private removePrimaryFromCompany(companyId: string, excludeId?: string): void {
    let query = 'UPDATE contacts SET is_primary = 0 WHERE company_id = ?';
    const params = [companyId];
    
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    
    const stmt = this.db.prepare(query);
    stmt.run(...params);
  }

  // Get statistics
  getStats() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM contacts');
    const activeStmt = this.db.prepare('SELECT COUNT(*) as count FROM contacts WHERE status = ?');
    const primaryStmt = this.db.prepare('SELECT COUNT(*) as count FROM contacts WHERE is_primary = 1');
    
    return {
      total: totalStmt.get().count,
      active: activeStmt.get('active').count,
      primary: primaryStmt.get().count,
    };
  }
}

export const contactService = new ContactService();