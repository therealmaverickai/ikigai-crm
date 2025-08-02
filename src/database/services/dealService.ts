import { getDatabase } from '../connection';
import type { Deal, DealFormData, DealFilters } from '../../types/crm';

export class DealService {
  private db = getDatabase();

  // Create
  create(data: DealFormData): Deal {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO deals (
        id, company_id, title, description, value, currency, probability, 
        stage, priority, source, expected_close_date, actual_close_date,
        assigned_user_id, value_source, converted_to_project, converted_to_project_at, project_id, 
        tags, notes, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, data.companyId, data.title, data.description, data.value, data.currency,
      data.probability, data.stage, data.priority, data.source, 
      data.expectedCloseDate.toISOString(), null, null, data.valueSource,
      false, null, null, // converted_to_project, converted_to_project_at, project_id
      JSON.stringify(data.tags), data.notes, data.status, now, now
    );
    
    return this.findById(id)!;
  }

  // Read
  findAll(): Deal[] {
    const stmt = this.db.prepare(`
      SELECT id, company_id as companyId, title, description, value, currency, 
             probability, stage, priority, source, expected_close_date, 
             actual_close_date, assigned_user_id as assignedUserId, 
             value_source as valueSource, converted_to_project, converted_to_project_at, project_id,
             tags, notes, status, created_at, updated_at 
      FROM deals 
      ORDER BY created_at DESC
    `);
    
    return stmt.all().map(this.mapRow);
  }

  findById(id: string): Deal | null {
    const stmt = this.db.prepare(`
      SELECT id, company_id as companyId, title, description, value, currency, 
             probability, stage, priority, source, expected_close_date, 
             actual_close_date, assigned_user_id as assignedUserId, 
             value_source as valueSource, converted_to_project, converted_to_project_at, project_id,
             tags, notes, status, created_at, updated_at 
      FROM deals 
      WHERE id = ?
    `);
    
    const row = stmt.get(id);
    return row ? this.mapRow(row) : null;
  }

  findByCompany(companyId: string): Deal[] {
    const stmt = this.db.prepare(`
      SELECT id, company_id as companyId, title, description, value, currency, 
             probability, stage, priority, source, expected_close_date, 
             actual_close_date, assigned_user_id as assignedUserId, 
             value_source as valueSource, converted_to_project, converted_to_project_at, project_id,
             tags, notes, status, created_at, updated_at 
      FROM deals 
      WHERE company_id = ?
      ORDER BY created_at DESC
    `);
    
    return stmt.all(companyId).map(this.mapRow);
  }

  findFiltered(filters: DealFilters): Deal[] {
    let query = `
      SELECT id, company_id as companyId, title, description, value, currency, 
             probability, stage, priority, source, expected_close_date, 
             actual_close_date, assigned_user_id as assignedUserId, 
             value_source as valueSource, converted_to_project, converted_to_project_at, project_id,
             tags, notes, status, created_at, updated_at 
      FROM deals 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.companyId) {
      query += ` AND company_id = ?`;
      params.push(filters.companyId);
    }

    if (filters.stage) {
      query += ` AND stage = ?`;
      params.push(filters.stage);
    }

    if (filters.priority) {
      query += ` AND priority = ?`;
      params.push(filters.priority);
    }

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.valueMin !== undefined) {
      query += ` AND value >= ?`;
      params.push(filters.valueMin);
    }

    if (filters.valueMax !== undefined) {
      query += ` AND value <= ?`;
      params.push(filters.valueMax);
    }

    if (filters.probabilityMin !== undefined) {
      query += ` AND probability >= ?`;
      params.push(filters.probabilityMin);
    }

    if (filters.probabilityMax !== undefined) {
      query += ` AND probability <= ?`;
      params.push(filters.probabilityMax);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params).map(this.mapRow);
  }

  // Update
  update(id: string, data: Partial<DealFormData>): Deal | null {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        let dbKey = key;
        let dbValue = value;
        
        // Handle camelCase to snake_case conversion and special types
        switch (key) {
          case 'companyId': dbKey = 'company_id'; break;
          case 'expectedCloseDate': 
            dbKey = 'expected_close_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'actualCloseDate': 
            dbKey = 'actual_close_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'assignedUserId': dbKey = 'assigned_user_id'; break;
          case 'valueSource': dbKey = 'value_source'; break;
          case 'convertedToProject': dbKey = 'converted_to_project'; break;
          case 'convertedToProjectAt': 
            dbKey = 'converted_to_project_at';
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'projectId': dbKey = 'project_id'; break;
          case 'tags': dbValue = JSON.stringify(value); break;
        }
        
        fields.push(`${dbKey} = ?`);
        params.push(dbValue);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE deals 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findById(id);
  }

  // Delete
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM deals WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Helper methods
  private generateId(): string {
    return 'deal_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private mapRow(row: any): Deal {
    return {
      ...row,
      expectedCloseDate: new Date(row.expected_close_date),
      actualCloseDate: row.actual_close_date ? new Date(row.actual_close_date) : undefined,
      convertedToProject: Boolean(row.converted_to_project),
      convertedToProjectAt: row.converted_to_project_at ? new Date(row.converted_to_project_at) : undefined,
      projectId: row.project_id || undefined,
      tags: row.tags ? JSON.parse(row.tags) : [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Get statistics
  getStats() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM deals');
    const activeStmt = this.db.prepare('SELECT COUNT(*) as count FROM deals WHERE status = ?');
    const wonStmt = this.db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(value), 0) as value FROM deals WHERE stage = ?');
    const pipelineStmt = this.db.prepare(`
      SELECT COALESCE(SUM(value * probability / 100.0), 0) as value 
      FROM deals 
      WHERE stage NOT IN ('closed-won', 'closed-lost')
    `);
    
    const wonData = wonStmt.get('closed-won');
    const pipelineData = pipelineStmt.get();
    
    return {
      total: totalStmt.get().count,
      active: activeStmt.get('active').count,
      wonCount: wonData.count,
      wonValue: wonData.value,
      pipelineValue: pipelineData.value,
    };
  }
}

export const dealService = new DealService();