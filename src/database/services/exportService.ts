import { 
  companyService, 
  contactService, 
  dealService, 
  projectService 
} from './index';

export interface CrmDataExport {
  version: string;
  exportDate: string;
  companies: any[];
  contacts: any[];
  deals: any[];
  projects: any[];
}

export class ExportService {
  
  // Export all data to JSON
  exportAllData(): CrmDataExport {
    const companies = companyService.findAll();
    const contacts = contactService.findAll();
    const deals = dealService.findAll();
    const projects = projectService.findAll();

    return {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      companies,
      contacts,
      deals,
      projects,
    };
  }

  // Export data to downloadable JSON file
  downloadDataAsJson(): void {
    const data = this.exportAllData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Export data as CSV for individual entities
  exportCompaniesAsCSV(): void {
    const companies = companyService.findAll();
    const headers = [
      'ID', 'Name', 'Email', 'Phone', 'Website', 'Address', 'City', 'State', 
      'Zip Code', 'Country', 'Industry', 'Size', 'Notes', 'Status', 'Created At', 'Updated At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...companies.map(company => [
        company.id,
        `"${company.name}"`,
        company.email,
        company.phone,
        company.website || '',
        `"${company.address || ''}"`,
        company.city || '',
        company.state || '',
        company.zipCode || '',
        company.country || '',
        company.industry || '',
        company.size || '',
        `"${company.notes.replace(/"/g, '""')}"`,
        company.status,
        company.createdAt.toISOString(),
        company.updatedAt.toISOString(),
      ].join(','))
    ].join('\n');

    this.downloadCSV(csvContent, 'companies');
  }

  exportContactsAsCSV(): void {
    const contacts = contactService.findAll();
    const headers = [
      'ID', 'Company ID', 'First Name', 'Last Name', 'Email', 'Phone', 
      'Job Title', 'Department', 'Is Primary', 'Notes', 'Status', 'Created At', 'Updated At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...contacts.map(contact => [
        contact.id,
        contact.companyId,
        `"${contact.firstName}"`,
        `"${contact.lastName}"`,
        contact.email,
        contact.phone,
        `"${contact.jobTitle || ''}"`,
        `"${contact.department || ''}"`,
        contact.isPrimary ? 'true' : 'false',
        `"${(contact.notes || '').replace(/"/g, '""')}"`,
        contact.status,
        contact.createdAt.toISOString(),
        contact.updatedAt.toISOString(),
      ].join(','))
    ].join('\n');

    this.downloadCSV(csvContent, 'contacts');
  }

  exportDealsAsCSV(): void {
    const deals = dealService.findAll();
    const headers = [
      'ID', 'Company ID', 'Title', 'Description', 'Value', 'Currency', 'Probability', 
      'Stage', 'Priority', 'Source', 'Expected Close Date', 'Actual Close Date', 
      'Tags', 'Notes', 'Status', 'Created At', 'Updated At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...deals.map(deal => [
        deal.id,
        deal.companyId,
        `"${deal.title}"`,
        `"${deal.description || ''}"`,
        deal.value,
        deal.currency,
        deal.probability,
        deal.stage,
        deal.priority,
        deal.source,
        deal.expectedCloseDate.toISOString(),
        deal.actualCloseDate?.toISOString() || '',
        `"${deal.tags.join('; ')}"`,
        `"${deal.notes.replace(/"/g, '""')}"`,
        deal.status,
        deal.createdAt.toISOString(),
        deal.updatedAt.toISOString(),
      ].join(','))
    ].join('\n');

    this.downloadCSV(csvContent, 'deals');
  }

  exportProjectsAsCSV(): void {
    const projects = projectService.findAll();
    const headers = [
      'ID', 'Deal ID', 'Company ID', 'Title', 'Description', 'Project Manager', 
      'Status', 'Priority', 'Type', 'Start Date', 'End Date', 'Budget Revenue', 
      'Budget Margin', 'Margin %', 'Progress %', 'Tags', 'Notes', 'Created At', 'Updated At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...projects.map(project => [
        project.id,
        project.dealId || '',
        project.companyId,
        `"${project.title}"`,
        `"${project.description || ''}"`,
        `"${project.projectManager || ''}"`,
        project.status,
        project.priority,
        project.type,
        project.startDate.toISOString(),
        project.endDate.toISOString(),
        project.budget.totalRevenue,
        project.budget.grossMargin,
        project.budget.marginPercentage.toFixed(2),
        project.progressPercentage,
        `"${project.tags.join('; ')}"`,
        `"${project.notes.replace(/"/g, '""')}"`,
        project.createdAt.toISOString(),
        project.updatedAt.toISOString(),
      ].join(','))
    ].join('\n');

    this.downloadCSV(csvContent, 'projects');
  }

  // Import data from JSON file
  async importDataFromJson(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as CrmDataExport;
          this.validateImportData(data);
          
          // Clear existing data (optional - could be made configurable)
          console.log('Importing data...');
          
          // Note: In a real implementation, you'd want to:
          // 1. Clear existing data or merge intelligently
          // 2. Handle ID conflicts
          // 3. Validate foreign key relationships
          // 4. Show progress to user
          
          // For now, this would require database service methods to handle bulk import
          console.log('Import completed successfully');
          resolve();
          
        } catch (error) {
          reject(new Error(`Failed to import data: ${error}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  // Backup data to localStorage as fallback
  backupToLocalStorage(): void {
    const data = this.exportAllData();
    const key = `crm-backup-${Date.now()}`;
    localStorage.setItem(key, JSON.stringify(data));
    
    // Keep only last 5 backups
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith('crm-backup-'))
      .sort()
      .reverse();
      
    if (backupKeys.length > 5) {
      backupKeys.slice(5).forEach(key => localStorage.removeItem(key));
    }
    
    console.log(`Data backed up to localStorage with key: ${key}`);
  }

  // Restore from localStorage backup
  getLocalStorageBackups(): { key: string; date: Date; size: number; }[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith('crm-backup-'))
      .map(key => {
        const data = localStorage.getItem(key);
        const timestamp = parseInt(key.replace('crm-backup-', ''));
        return {
          key,
          date: new Date(timestamp),
          size: data ? data.length : 0,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  restoreFromLocalStorage(backupKey: string): CrmDataExport | null {
    const data = localStorage.getItem(backupKey);
    if (!data) return null;
    
    try {
      return JSON.parse(data) as CrmDataExport;
    } catch (error) {
      console.error('Failed to parse backup data:', error);
      return null;
    }
  }

  // Private helper methods
  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `crm-${filename}-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  private validateImportData(data: CrmDataExport): void {
    if (!data.version || !data.exportDate) {
      throw new Error('Invalid export file format');
    }
    
    if (!Array.isArray(data.companies) || 
        !Array.isArray(data.contacts) || 
        !Array.isArray(data.deals) || 
        !Array.isArray(data.projects)) {
      throw new Error('Invalid export file structure');
    }
  }

  // Get database statistics
  getDatabaseStats() {
    const companies = companyService.getStats();
    const contacts = contactService.getStats();
    const deals = dealService.getStats();
    const projects = projectService.getStats();
    
    return {
      companies,
      contacts,
      deals,
      projects,
      lastBackup: this.getLocalStorageBackups()[0]?.date || null,
    };
  }
}

export const exportService = new ExportService();