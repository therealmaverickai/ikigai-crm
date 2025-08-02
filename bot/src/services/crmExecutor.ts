import { supabaseApiSimple } from './supabaseClientSimple.js';
import { ParsedIntent } from './openaiService.js';

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class CRMExecutor {
  async executeAction(intent: ParsedIntent): Promise<ExecutionResult> {
    try {
      switch (intent.action) {
        case 'create_company':
          return await this.createCompany(intent.entities);
        
        case 'create_contact':
          return await this.createContact(intent.entities);
        
        case 'create_deal':
          return await this.createDeal(intent.entities);
        
        case 'create_project':
          return await this.createProject(intent.entities);
        
        case 'create_time_entry':
          return await this.createTimeEntry(intent.entities);
        
        case 'get_companies':
          return await this.getCompanies(intent.entities);
        
        case 'get_contacts':
          return await this.getContacts(intent.entities);
        
        case 'get_deals':
          return await this.getDeals(intent.entities);
        
        case 'get_projects':
          return await this.getProjects(intent.entities);
        
        case 'get_time_entries':
          return await this.getTimeEntries(intent.entities);
        
        case 'help':
          return this.getHelp();
        
        default:
          return {
            success: false,
            error: `Unknown action: ${intent.action}`,
            message: "I don't understand what you want me to do. Try asking me to create a company, contact, deal, or project."
          };
      }
    } catch (error: any) {
      console.error('Error executing CRM action:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        message: 'Sorry, I encountered an error while processing your request.'
      };
    }
  }

  private async createCompany(entities: any): Promise<ExecutionResult> {
    if (!entities.companyName) {
      return {
        success: false,
        error: 'Company name is required',
        message: 'Please provide a company name to create a new client.'
      };
    }

    try {
      const company = await supabaseApiSimple.createCompany({
        name: entities.companyName,
        industry: entities.industry || '',
        size: entities.companySize || '',
        website: entities.website || '',
        phone: entities.phone || '',
        email: entities.email || '',
        address: entities.address || {},
        notes: entities.notes || '',
        tags: entities.tags || []
      });

      // If there's also deal information, create the deal
      let deal = null;
      if (entities.dealTitle || entities.dealValue) {
        try {
          deal = await supabaseApiSimple.createDeal({
            companyId: company.id,
            title: entities.dealTitle || `Deal for ${entities.companyName}`,
            value: entities.dealValue || 0,
            currency: entities.dealCurrency || 'USD',
            stage: entities.dealStage || 'prospecting',
            probability: entities.dealProbability || 25,
            description: entities.dealDescription || '',
            notes: entities.dealNotes || '',
            tags: entities.dealTags || []
          });
        } catch (dealError) {
          console.warn('Company created but deal creation failed:', dealError);
        }
      }

      return {
        success: true,
        data: { company, deal },
        message: deal 
          ? `Created company "${company.name}" with a ${entities.dealCurrency || 'USD'} ${entities.dealValue || 0} deal`
          : `Created company "${company.name}"`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to create company "${entities.companyName}". ${error.message}`
      };
    }
  }

  private async createContact(entities: any): Promise<ExecutionResult> {
    if (!entities.contactFirstName || !entities.contactLastName) {
      return {
        success: false,
        error: 'Contact first and last name are required',
        message: 'Please provide both first and last name for the contact.'
      };
    }

    try {
      // If company name is provided, try to find the company
      let companyId = entities.companyId;
      if (entities.companyName && !companyId) {
        try {
          const companies = await supabaseApiSimple.getCompanies();
          const foundCompany = companies.find(c => 
            c.name.toLowerCase().includes(entities.companyName.toLowerCase())
          );
          if (foundCompany) {
            companyId = foundCompany.id;
          }
        } catch (error) {
          console.warn('Could not find company:', error);
        }
      }

      const contact = await supabaseApiSimple.createContact({
        companyId: companyId || '',
        firstName: entities.contactFirstName,
        lastName: entities.contactLastName,
        email: entities.contactEmail || '',
        phone: entities.contactPhone || '',
        position: entities.contactPosition || '',
        department: entities.contactDepartment || '',
        isPrimary: entities.isPrimary || false,
        notes: entities.notes || '',
        tags: entities.tags || []
      });

      return {
        success: true,
        data: contact,
        message: `Created contact "${contact.firstName} ${contact.lastName}"${companyId ? ` for company` : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to create contact "${entities.contactFirstName} ${entities.contactLastName}". ${error.message}`
      };
    }
  }

  private async createDeal(entities: any): Promise<ExecutionResult> {
    if (!entities.dealTitle && !entities.dealValue) {
      return {
        success: false,
        error: 'Deal title or value is required',
        message: 'Please provide a deal title or value to create a new deal.'
      };
    }

    try {
      // Try to find company if company name is provided
      let companyId = entities.companyId;
      if (entities.companyName && !companyId) {
        try {
          const companies = await supabaseApiSimple.getCompanies();
          const foundCompany = companies.find(c => 
            c.name.toLowerCase().includes(entities.companyName.toLowerCase())
          );
          if (foundCompany) {
            companyId = foundCompany.id;
          }
        } catch (error) {
          console.warn('Could not find company:', error);
        }
      }

      const deal = await supabaseApiSimple.createDeal({
        companyId: companyId || '',
        title: entities.dealTitle || `Deal - ${entities.dealValue} ${entities.dealCurrency || 'USD'}`,
        value: entities.dealValue || 0,
        currency: entities.dealCurrency || 'USD',
        stage: entities.dealStage || 'prospecting',
        probability: entities.dealProbability || 25,
        description: entities.dealDescription || '',
        notes: entities.dealNotes || '',
        tags: entities.dealTags || []
      });

      return {
        success: true,
        data: deal,
        message: `Created deal "${deal.title}" worth ${deal.currency} ${deal.value}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to create deal. ${error.message}`
      };
    }
  }

  private async createProject(entities: any): Promise<ExecutionResult> {
    if (!entities.projectTitle) {
      return {
        success: false,
        error: 'Project title is required',
        message: 'Please provide a project title to create a new project.'
      };
    }

    try {
      const project = await supabaseApiSimple.createProject({
        title: entities.projectTitle,
        description: entities.projectDescription || '',
        status: entities.projectStatus || 'planning',
        companyId: entities.companyId || '',
        dealId: entities.dealId || '',
        budget: {
          resources: [],
          expenses: [],
          contingencyPercentage: 10
        },
        tags: entities.tags || []
      });

      return {
        success: true,
        data: project,
        message: `Created project "${project.title}"`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to create project "${entities.projectTitle}". ${error.message}`
      };
    }
  }

  private async createTimeEntry(entities: any): Promise<ExecutionResult> {
    if (!entities.timeHours && !entities.timeDescription) {
      return {
        success: false,
        error: 'Time hours or description is required',
        message: 'Please provide either time worked or a description of the work.'
      };
    }

    try {
      const timeEntry = await supabaseApiSimple.createTimeEntry({
        projectId: entities.projectId || '',
        resourceName: entities.resourceName || 'Default User',
        description: entities.timeDescription || '',
        duration: (entities.timeHours || 1) * 60, // Convert hours to minutes
        date: entities.timeDate ? new Date(entities.timeDate) : new Date(),
        tags: entities.tags || [],
        billable: entities.billable !== false,
        hourlyRate: entities.hourlyRate || 0,
        currency: entities.currency || 'USD'
      });

      return {
        success: true,
        data: timeEntry,
        message: `Logged ${entities.timeHours || 1} hours of work${entities.timeDescription ? `: ${entities.timeDescription}` : ''}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `Failed to log time entry. ${error.message}`
      };
    }
  }

  private async getCompanies(entities: any): Promise<ExecutionResult> {
    try {
      const companies = await supabaseApiSimple.getCompanies();
      
      // Apply filters if provided
      let filteredCompanies = companies;
      if (entities.searchTerm) {
        filteredCompanies = companies.filter(c => 
          c.name.toLowerCase().includes(entities.searchTerm.toLowerCase()) ||
          c.industry.toLowerCase().includes(entities.searchTerm.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredCompanies,
        message: `Found ${filteredCompanies.length} companies`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve companies.'
      };
    }
  }

  private async getContacts(entities: any): Promise<ExecutionResult> {
    try {
      const contacts = await supabaseApiSimple.getContacts();
      
      let filteredContacts = contacts;
      if (entities.searchTerm) {
        filteredContacts = contacts.filter(c => 
          c.firstName.toLowerCase().includes(entities.searchTerm.toLowerCase()) ||
          c.lastName.toLowerCase().includes(entities.searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(entities.searchTerm.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredContacts,
        message: `Found ${filteredContacts.length} contacts`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve contacts.'
      };
    }
  }

  private async getDeals(entities: any): Promise<ExecutionResult> {
    try {
      const deals = await supabaseApiSimple.getDeals();
      
      let filteredDeals = deals;
      if (entities.minValue) {
        filteredDeals = filteredDeals.filter(d => d.value >= entities.minValue);
      }
      if (entities.maxValue) {
        filteredDeals = filteredDeals.filter(d => d.value <= entities.maxValue);
      }
      if (entities.stage) {
        filteredDeals = filteredDeals.filter(d => 
          d.stage.toLowerCase().includes(entities.stage.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredDeals,
        message: `Found ${filteredDeals.length} deals`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve deals.'
      };
    }
  }

  private async getProjects(entities: any): Promise<ExecutionResult> {
    try {
      const projects = await supabaseApiSimple.getProjects();
      
      let filteredProjects = projects;
      if (entities.status) {
        filteredProjects = projects.filter(p => 
          p.status.toLowerCase().includes(entities.status.toLowerCase())
        );
      }

      return {
        success: true,
        data: filteredProjects,
        message: `Found ${filteredProjects.length} projects`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve projects.'
      };
    }
  }

  private async getTimeEntries(entities: any): Promise<ExecutionResult> {
    try {
      const timeEntries = await supabaseApiSimple.getTimeEntries();
      
      return {
        success: true,
        data: timeEntries,
        message: `Found ${timeEntries.length} time entries`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve time entries.'
      };
    }
  }

  private getHelp(): ExecutionResult {
    const helpMessage = `
🤖 **Ikigai CRM Bot Commands**

**Create Operations:**
• "Create company [name]" - Add new client
• "Add contact [name] to [company]" - Add new contact
• "Create deal [title] worth $[amount]" - Add new deal
• "Create project [name]" - Add new project
• "Log [X] hours on [description]" - Track time

**Search Operations:**
• "Show all companies" - List companies
• "Find contacts" - List contacts  
• "Show deals above $[amount]" - Filter deals
• "List active projects" - Show projects

**Examples:**
• "Create client TechCorp with $50k software deal"
• "Add John Smith to TechCorp, email john@tech.com"
• "Show me all deals above $10000"
• "Log 3 hours working on website design"

Just ask me in natural language - I'll understand! 😊
    `;

    return {
      success: true,
      data: helpMessage,
      message: helpMessage
    };
  }
}

export default CRMExecutor;