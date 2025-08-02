import { getDatabase } from '../connection';
import type { 
  Project, 
  ProjectFormData, 
  ProjectFilters, 
  ProjectResource, 
  ProjectExpense, 
  ProjectResourceFormData, 
  ProjectExpenseFormData,
  ProjectBudget,
  Deal,
  Quotation 
} from '../../types/crm';

export class ProjectService {
  private db = getDatabase();

  // Create
  create(data: ProjectFormData, calculatedBudget: ProjectBudget): Project {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const stmt = this.db.prepare(`
      INSERT INTO projects (
        id, deal_id, selected_quotation_id, company_id, title, description, project_manager, status, 
        priority, type, start_date, end_date, actual_start_date, actual_end_date,
        budget_total_revenue, budget_contingency_percentage, budget_overhead_percentage, 
        budget_currency, budget_total_resource_cost, budget_total_expense_cost, 
        budget_contingency_cost, budget_overhead_cost, budget_total_cost, 
        budget_gross_margin, budget_margin_percentage, progress_percentage, 
        tags, notes, created_from_deal, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, data.dealId || null, data.selectedQuotationId || null, data.companyId, data.title, data.description, 
      data.projectManager, data.status, data.priority, data.type,
      data.startDate.toISOString(), data.endDate.toISOString(), null, null,
      calculatedBudget.totalRevenue, calculatedBudget.contingencyPercentage, 
      calculatedBudget.overheadPercentage, calculatedBudget.currency,
      calculatedBudget.totalResourceCost, calculatedBudget.totalExpenseCost,
      calculatedBudget.contingencyCost, calculatedBudget.overheadCost,
      calculatedBudget.totalCost, calculatedBudget.grossMargin, 
      calculatedBudget.marginPercentage, data.progressPercentage,
      JSON.stringify(data.tags), data.notes, !!data.dealId, now, now
    );
    
    // Create resources
    for (const resource of calculatedBudget.resources) {
      this.createResource(id, resource);
    }
    
    // Create expenses
    for (const expense of calculatedBudget.expenses) {
      this.createExpense(id, expense);
    }
    
    return this.findById(id)!;
  }

  // Read
  findAll(): Project[] {
    const projects = this.findProjectsOnly();
    return projects.map(project => this.loadProjectDetails(project));
  }

  findById(id: string): Project | null {
    const project = this.findProjectOnly(id);
    if (!project) return null;
    return this.loadProjectDetails(project);
  }

  findByCompany(companyId: string): Project[] {
    const stmt = this.db.prepare(`
      SELECT * FROM projects WHERE company_id = ? ORDER BY created_at DESC
    `);
    
    const projects = stmt.all(companyId).map(this.mapProjectRow);
    return projects.map(project => this.loadProjectDetails(project));
  }

  findFiltered(filters: ProjectFilters): Project[] {
    let query = `SELECT * FROM projects WHERE 1=1`;
    const params: any[] = [];

    if (filters.search) {
      query += ` AND (title LIKE ? OR description LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.companyId) {
      query += ` AND company_id = ?`;
      params.push(filters.companyId);
    }

    if (filters.status) {
      query += ` AND status = ?`;
      params.push(filters.status);
    }

    if (filters.priority) {
      query += ` AND priority = ?`;
      params.push(filters.priority);
    }

    if (filters.type) {
      query += ` AND type = ?`;
      params.push(filters.type);
    }

    if (filters.projectManager) {
      query += ` AND project_manager LIKE ?`;
      params.push(`%${filters.projectManager}%`);
    }

    if (filters.budgetMin !== undefined) {
      query += ` AND budget_total_revenue >= ?`;
      params.push(filters.budgetMin);
    }

    if (filters.budgetMax !== undefined) {
      query += ` AND budget_total_revenue <= ?`;
      params.push(filters.budgetMax);
    }

    if (filters.marginMin !== undefined) {
      query += ` AND budget_margin_percentage >= ?`;
      params.push(filters.marginMin);
    }

    if (filters.marginMax !== undefined) {
      query += ` AND budget_margin_percentage <= ?`;
      params.push(filters.marginMax);
    }

    query += ` ORDER BY created_at DESC`;

    const stmt = this.db.prepare(query);
    const projects = stmt.all(...params).map(this.mapProjectRow);
    return projects.map(project => this.loadProjectDetails(project));
  }

  // Update
  update(id: string, data: Partial<ProjectFormData>, calculatedBudget?: ProjectBudget): Project | null {
    const fields: string[] = [];
    const params: any[] = [];

    // Handle basic project fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'budget') {
        let dbKey = key;
        let dbValue = value;
        
        switch (key) {
          case 'dealId': dbKey = 'deal_id'; break;
          case 'selectedQuotationId': dbKey = 'selected_quotation_id'; break;
          case 'companyId': dbKey = 'company_id'; break;
          case 'projectManager': dbKey = 'project_manager'; break;
          case 'startDate': 
            dbKey = 'start_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'endDate': 
            dbKey = 'end_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'actualStartDate': 
            dbKey = 'actual_start_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'actualEndDate': 
            dbKey = 'actual_end_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'progressPercentage': dbKey = 'progress_percentage'; break;
          case 'tags': dbValue = JSON.stringify(value); break;
        }
        
        fields.push(`${dbKey} = ?`);
        params.push(dbValue);
      }
    });

    // Handle budget update
    if (calculatedBudget) {
      fields.push(
        'budget_total_revenue = ?', 'budget_contingency_percentage = ?', 
        'budget_overhead_percentage = ?', 'budget_currency = ?',
        'budget_total_resource_cost = ?', 'budget_total_expense_cost = ?',
        'budget_contingency_cost = ?', 'budget_overhead_cost = ?',
        'budget_total_cost = ?', 'budget_gross_margin = ?', 'budget_margin_percentage = ?'
      );
      params.push(
        calculatedBudget.totalRevenue, calculatedBudget.contingencyPercentage,
        calculatedBudget.overheadPercentage, calculatedBudget.currency,
        calculatedBudget.totalResourceCost, calculatedBudget.totalExpenseCost,
        calculatedBudget.contingencyCost, calculatedBudget.overheadCost,
        calculatedBudget.totalCost, calculatedBudget.grossMargin, 
        calculatedBudget.marginPercentage
      );

      // Update resources and expenses
      this.updateResources(id, calculatedBudget.resources);
      this.updateExpenses(id, calculatedBudget.expenses);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    
    const stmt = this.db.prepare(`
      UPDATE projects 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findById(id);
  }

  // Delete
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Resource management
  addResource(projectId: string, resource: ProjectResourceFormData): ProjectResource {
    const id = this.generateId();
    return this.createResource(projectId, { ...resource, id });
  }

  updateResource(projectId: string, resourceId: string, data: Partial<ProjectResourceFormData>): ProjectResource | null {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        let dbKey = key;
        let dbValue = value;
        
        switch (key) {
          case 'hourlyRate': dbKey = 'hourly_rate'; break;
          case 'hoursAllocated': dbKey = 'hours_allocated'; break;
          case 'hoursActual': dbKey = 'hours_actual'; break;
          case 'startDate': 
            dbKey = 'start_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'endDate': 
            dbKey = 'end_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
          case 'skills': dbValue = JSON.stringify(value); break;
        }
        
        fields.push(`${dbKey} = ?`);
        params.push(dbValue);
      }
    });

    if (fields.length === 0) {
      return this.findResourceById(resourceId);
    }

    params.push(resourceId);
    
    const stmt = this.db.prepare(`
      UPDATE project_resources 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findResourceById(resourceId);
  }

  removeResource(projectId: string, resourceId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM project_resources WHERE id = ? AND project_id = ?');
    const result = stmt.run(resourceId, projectId);
    return result.changes > 0;
  }

  // Expense management
  addExpense(projectId: string, expense: ProjectExpenseFormData): ProjectExpense {
    const id = this.generateId();
    return this.createExpense(projectId, { ...expense, id });
  }

  updateExpense(projectId: string, expenseId: string, data: Partial<ProjectExpenseFormData>): ProjectExpense | null {
    const fields: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        let dbKey = key;
        let dbValue = value;
        
        switch (key) {
          case 'plannedCost': dbKey = 'planned_cost'; break;
          case 'actualCost': dbKey = 'actual_cost'; break;
          case 'dueDate': 
            dbKey = 'due_date'; 
            dbValue = value instanceof Date ? value.toISOString() : value;
            break;
        }
        
        fields.push(`${dbKey} = ?`);
        params.push(dbValue);
      }
    });

    if (fields.length === 0) {
      return this.findExpenseById(expenseId);
    }

    params.push(expenseId);
    
    const stmt = this.db.prepare(`
      UPDATE project_expenses 
      SET ${fields.join(', ')} 
      WHERE id = ?
    `);
    
    stmt.run(...params);
    return this.findExpenseById(expenseId);
  }

  removeExpense(projectId: string, expenseId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM project_expenses WHERE id = ? AND project_id = ?');
    const result = stmt.run(expenseId, projectId);
    return result.changes > 0;
  }

  // Private helper methods
  private findProjectsOnly(): Project[] {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
    return stmt.all().map(this.mapProjectRow);
  }

  private findProjectOnly(id: string): Project | null {
    const stmt = this.db.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapProjectRow(row) : null;
  }

  private loadProjectDetails(project: Project): Project {
    const resources = this.findResourcesByProject(project.id);
    const expenses = this.findExpensesByProject(project.id);
    
    return {
      ...project,
      budget: {
        ...project.budget,
        resources,
        expenses,
      },
      milestones: [], // TODO: Implement milestones if needed
    };
  }

  private findResourcesByProject(projectId: string): ProjectResource[] {
    const stmt = this.db.prepare(`
      SELECT id, project_id as projectId, name, type, role, hourly_rate as hourlyRate, 
             currency, hours_allocated as hoursAllocated, hours_actual as hoursActual, 
             start_date, end_date, skills, notes 
      FROM project_resources 
      WHERE project_id = ?
    `);
    
    return stmt.all(projectId).map(this.mapResourceRow);
  }

  private findExpensesByProject(projectId: string): ProjectExpense[] {
    const stmt = this.db.prepare(`
      SELECT id, project_id as projectId, category, description, planned_cost as plannedCost, 
             actual_cost as actualCost, currency, due_date, vendor, status, notes 
      FROM project_expenses 
      WHERE project_id = ?
    `);
    
    return stmt.all(projectId).map(this.mapExpenseRow);
  }

  private findResourceById(id: string): ProjectResource | null {
    const stmt = this.db.prepare(`
      SELECT id, project_id as projectId, name, type, role, hourly_rate as hourlyRate, 
             currency, hours_allocated as hoursAllocated, hours_actual as hoursActual, 
             start_date, end_date, skills, notes 
      FROM project_resources 
      WHERE id = ?
    `);
    
    const row = stmt.get(id);
    return row ? this.mapResourceRow(row) : null;
  }

  private findExpenseById(id: string): ProjectExpense | null {
    const stmt = this.db.prepare(`
      SELECT id, project_id as projectId, category, description, planned_cost as plannedCost, 
             actual_cost as actualCost, currency, due_date, vendor, status, notes 
      FROM project_expenses 
      WHERE id = ?
    `);
    
    const row = stmt.get(id);
    return row ? this.mapExpenseRow(row) : null;
  }

  private createResource(projectId: string, resource: ProjectResource): ProjectResource {
    const stmt = this.db.prepare(`
      INSERT INTO project_resources (
        id, project_id, name, type, role, hourly_rate, currency, 
        hours_allocated, hours_actual, start_date, end_date, skills, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      resource.id, projectId, resource.name, resource.type, resource.role,
      resource.hourlyRate, resource.currency, resource.hoursAllocated, 
      resource.hoursActual || null, resource.startDate.toISOString(), 
      resource.endDate.toISOString(), JSON.stringify(resource.skills), 
      resource.notes || null
    );
    
    return resource;
  }

  private createExpense(projectId: string, expense: ProjectExpense): ProjectExpense {
    const stmt = this.db.prepare(`
      INSERT INTO project_expenses (
        id, project_id, category, description, planned_cost, actual_cost, 
        currency, due_date, vendor, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      expense.id, projectId, expense.category, expense.description, 
      expense.plannedCost, expense.actualCost || null, expense.currency,
      expense.dueDate ? expense.dueDate.toISOString() : null, 
      expense.vendor || null, expense.status, expense.notes || null
    );
    
    return expense;
  }

  private updateResources(projectId: string, resources: ProjectResource[]): void {
    // Delete existing resources
    const deleteStmt = this.db.prepare('DELETE FROM project_resources WHERE project_id = ?');
    deleteStmt.run(projectId);
    
    // Insert new resources
    for (const resource of resources) {
      this.createResource(projectId, resource);
    }
  }

  private updateExpenses(projectId: string, expenses: ProjectExpense[]): void {
    // Delete existing expenses
    const deleteStmt = this.db.prepare('DELETE FROM project_expenses WHERE project_id = ?');
    deleteStmt.run(projectId);
    
    // Insert new expenses
    for (const expense of expenses) {
      this.createExpense(projectId, expense);
    }
  }

  private generateId(): string {
    return 'proj_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private mapProjectRow(row: any): Project {
    return {
      id: row.id,
      dealId: row.deal_id,
      selectedQuotationId: row.selected_quotation_id,
      companyId: row.company_id,
      title: row.title,
      description: row.description,
      projectManager: row.project_manager,
      status: row.status,
      priority: row.priority,
      type: row.type,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      actualStartDate: row.actual_start_date ? new Date(row.actual_start_date) : undefined,
      actualEndDate: row.actual_end_date ? new Date(row.actual_end_date) : undefined,
      budget: {
        totalRevenue: row.budget_total_revenue,
        contingencyPercentage: row.budget_contingency_percentage,
        overheadPercentage: row.budget_overhead_percentage,
        currency: row.budget_currency,
        totalResourceCost: row.budget_total_resource_cost,
        totalExpenseCost: row.budget_total_expense_cost,
        contingencyCost: row.budget_contingency_cost,
        overheadCost: row.budget_overhead_cost,
        totalCost: row.budget_total_cost,
        grossMargin: row.budget_gross_margin,
        marginPercentage: row.budget_margin_percentage,
        resources: [], // Will be loaded separately
        expenses: [], // Will be loaded separately
      },
      progressPercentage: row.progress_percentage,
      milestones: [], // Will be loaded separately if needed
      tags: row.tags ? JSON.parse(row.tags) : [],
      notes: row.notes,
      createdFromDeal: Boolean(row.created_from_deal),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapResourceRow(row: any): ProjectResource {
    return {
      ...row,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      skills: row.skills ? JSON.parse(row.skills) : [],
    };
  }

  private mapExpenseRow(row: any): ProjectExpense {
    return {
      ...row,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
    };
  }

  // Create project from deal with quotation inheritance
  createFromDealWithQuotation(deal: Deal, quotation: Quotation): Project {
    // Create budget from quotation economics data
    const economicsData = quotation.economicsData;
    
    // Convert quotation line items to project resources/expenses approximation
    const resources: ProjectResource[] = [];
    const expenses: ProjectExpense[] = [];
    
    // For line items that look like services, create resources
    // For other items, create expenses
    economicsData.lineItems.forEach(item => {
      if (item.serviceName.toLowerCase().includes('developer') || 
          item.serviceName.toLowerCase().includes('consultant') ||
          item.serviceName.toLowerCase().includes('manager') ||
          item.serviceName.toLowerCase().includes('analyst')) {
        resources.push({
          id: this.generateId(),
          name: item.serviceName,
          type: 'internal' as const,
          role: item.serviceName,
          hourlyRate: item.unitPrice,
          currency: economicsData.currency,
          hoursAllocated: item.quantity,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
          skills: [],
          notes: item.notes
        });
      } else {
        expenses.push({
          id: this.generateId(),
          category: 'other' as const,
          description: item.serviceName,
          plannedCost: item.total,
          currency: economicsData.currency,
          status: 'planned' as const,
          notes: item.notes
        });
      }
    });

    const budget: ProjectBudget = {
      totalRevenue: economicsData.totalCost,
      resources,
      expenses,
      contingencyPercentage: 10, // Default
      overheadPercentage: 15, // Default
      currency: economicsData.currency,
      totalResourceCost: resources.reduce((sum, r) => sum + (r.hourlyRate * r.hoursAllocated), 0),
      totalExpenseCost: expenses.reduce((sum, e) => sum + e.plannedCost, 0),
      contingencyCost: 0, // Will be calculated
      overheadCost: 0, // Will be calculated
      totalCost: 0, // Will be calculated
      grossMargin: 0, // Will be calculated
      marginPercentage: 0 // Will be calculated
    };

    // Calculate derived values
    const subtotal = budget.totalResourceCost + budget.totalExpenseCost;
    budget.contingencyCost = subtotal * (budget.contingencyPercentage / 100);
    budget.overheadCost = subtotal * (budget.overheadPercentage / 100);
    budget.totalCost = subtotal + budget.contingencyCost + budget.overheadCost;
    budget.grossMargin = budget.totalRevenue - budget.totalCost;
    budget.marginPercentage = budget.totalRevenue > 0 ? (budget.grossMargin / budget.totalRevenue) * 100 : 0;

    const projectData: ProjectFormData = {
      dealId: deal.id,
      selectedQuotationId: quotation.id,
      companyId: deal.companyId,
      title: deal.title,
      description: deal.description,
      status: 'planning',
      priority: deal.priority,
      type: 'development', // Default, can be changed by user
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days default
      budget: {
        totalRevenue: budget.totalRevenue,
        contingencyPercentage: budget.contingencyPercentage,
        overheadPercentage: budget.overheadPercentage,
        currency: budget.currency
      },
      progressPercentage: 0,
      tags: deal.tags,
      notes: `Project created from deal "${deal.title}" using quotation "${quotation.quotationName}"\n\n${deal.notes}`
    };

    return this.create(projectData, budget);
  }

  // Get statistics
  getStats() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM projects');
    const activeStmt = this.db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?');
    const revenueStmt = this.db.prepare('SELECT COALESCE(SUM(budget_total_revenue), 0) as value FROM projects');
    const marginStmt = this.db.prepare('SELECT COALESCE(SUM(budget_gross_margin), 0) as value FROM projects');
    const avgMarginStmt = this.db.prepare('SELECT COALESCE(AVG(budget_margin_percentage), 0) as value FROM projects');
    
    return {
      total: totalStmt.get().count,
      active: activeStmt.get('active').count,
      totalRevenue: revenueStmt.get().value,
      totalMargin: marginStmt.get().value,
      avgMarginPercentage: avgMarginStmt.get().value,
    };
  }
}

export const projectService = new ProjectService();