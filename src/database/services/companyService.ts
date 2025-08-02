import { getDatabase } from '../connection';
import type { Company, CompanyFormData, CompanyFilters } from '../../types/crm';

export class CompanyService {
  private db = getDatabase();

  // Create
  create(data: CompanyFormData): Company {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO companies (
        id, name, email, phone, website, address, city, state, zip_code, 
        country, industry, size, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, data.name, data.email, data.phone, data.website, data.address,
      data.city, data.state, data.zipCode, data.country, data.industry,
      data.size, data.notes, data.status, now, now
    );
    
    return this.findById(id)!;
  }

  // Read
  findAll(): Company[] {
    const stmt = this.db.prepare(`
      SELECT id, name, email, phone, website, address, city, state, 
             zip_code as zipCode, country, industry, size, notes, 
             status, created_at, updated_at 
      FROM companies 
      ORDER BY created_at DESC
    `);
    
    return stmt.all().map(this.mapRow);
  }

  findById(id: string): Company | null {
    const stmt = this.db.prepare(`
      SELECT id, name, email, phone, website, address, city, state, 
             zip_code as zipCode, country, industry, size, notes, 
             status, created_at, updated_at 
      FROM companies 
      WHERE id = ?
    `);
    
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  findFiltered(filters: CompanyFilters): Company[] {
    let query = `
      SELECT id, name, email, phone, website, address, city, state, 
             zip_code as zipCode, country, industry, size, notes, 
             status, created_at, updated_at 
      FROM companies 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.industry) {
      query += ` AND industry = ?`;
      params.push(filters.industry);
    }

    if (filters.size) {
      query += ` AND size = ?`;
      params.push(filters.size);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params).map(this.mapRow);
  }

  // Update
  update(id: string, data: Partial<CompanyFormData>): Company | null {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key === 'zipCode' ? 'zip_code' : key;
        fields.push(`${dbKey} = ?`);
        params.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE companies 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findById(id);
  }

  // Delete
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM companies WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Helper methods
  private generateId(): string {
    return 'comp_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private mapRow(row: any): Company {
    return {
      ...row,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Get statistics
  getStats() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM companies');
    const activeStmt = this.db.prepare('SELECT COUNT(*) as count FROM companies WHERE status = ?');
    const prospectStmt = this.db.prepare('SELECT COUNT(*) as count FROM companies WHERE status = ?');
    
    return {
      total: totalStmt.get().count,
      active: activeStmt.get('active').count,
      prospects: prospectStmt.get('prospect').count,
    };
  }
}

export const companyService = new CompanyService();