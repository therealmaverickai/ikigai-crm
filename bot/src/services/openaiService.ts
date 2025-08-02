import OpenAI from 'openai';

export interface ParsedIntent {
  action: 'create_company' | 'create_contact' | 'create_deal' | 'create_project' | 'create_time_entry' | 
          'get_companies' | 'get_contacts' | 'get_deals' | 'get_projects' | 'get_time_entries' |
          'update_company' | 'update_contact' | 'update_deal' | 'update_project' |
          'delete_company' | 'delete_contact' | 'delete_deal' | 'delete_project' |
          'help' | 'unknown';
  entities: {
    companyName?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactPosition?: string;
    dealTitle?: string;
    dealValue?: number;
    dealCurrency?: string;
    dealStage?: string;
    dealProbability?: number;
    projectTitle?: string;
    projectDescription?: string;
    projectStatus?: string;
    timeDescription?: string;
    timeHours?: number;
    timeDate?: string;
    resourceName?: string;
    [key: string]: any;
  };
  confidence: number;
  originalMessage: string;
}

class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    console.log('🔑 OpenAI API Key length:', apiKey ? apiKey.length : 'MISSING');
    console.log('🔑 OpenAI API Key starts with:', apiKey ? apiKey.substring(0, 7) + '...' : 'MISSING');
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey
    });
  }

  async parseUserMessage(message: string): Promise<ParsedIntent> {
    try {
      const systemPrompt = `You are an AI assistant that analyzes user messages for a CRM system called Ikigai. 
      
Your job is to understand what the user wants to do and extract structured information.

Available actions:
- create_company: Create a new company/client
- create_contact: Create a new contact person
- create_deal: Create a new business deal/opportunity  
- create_project: Create a new project
- create_time_entry: Log time worked on a project
- get_companies: List/search companies
- get_contacts: List/search contacts
- get_deals: List/search deals
- get_projects: List/search projects
- get_time_entries: List/search time entries
- update_*: Update existing records
- delete_*: Delete records
- help: User needs help/instructions
- unknown: Cannot understand the request

Respond with a JSON object containing:
{
  "action": "the_action_type",
  "entities": {
    "companyName": "extracted company name",
    "dealValue": extracted_number,
    "dealCurrency": "USD/EUR/etc",
    "contactFirstName": "first name",
    "contactLastName": "last name",
    // ... other relevant fields
  },
  "confidence": 0.8,
  "originalMessage": "the original message"
}

Examples:
"Create a new client called TechCorp with a $50k software deal" → 
{
  "action": "create_company",
  "entities": {
    "companyName": "TechCorp",
    "dealTitle": "software deal", 
    "dealValue": 50000,
    "dealCurrency": "USD"
  },
  "confidence": 0.9,
  "originalMessage": "Create a new client called TechCorp with a $50k software deal"
}

"Add John Smith as contact for TechCorp, email john@techcorp.com" →
{
  "action": "create_contact",
  "entities": {
    "contactFirstName": "John",
    "contactLastName": "Smith", 
    "companyName": "TechCorp",
    "contactEmail": "john@techcorp.com"
  },
  "confidence": 0.9,
  "originalMessage": "Add John Smith as contact for TechCorp, email john@techcorp.com"
}

"Show me all deals above $10000" →
{
  "action": "get_deals",
  "entities": {
    "minValue": 10000
  },
  "confidence": 0.8,
  "originalMessage": "Show me all deals above $10000"
}

Respond ONLY with the JSON object, no additional text.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const parsed = JSON.parse(response) as ParsedIntent;
      return parsed;

    } catch (error) {
      console.error('Error parsing message with OpenAI:', error);
      return {
        action: 'unknown',
        entities: {},
        confidence: 0,
        originalMessage: message
      };
    }
  }

  async generateResponse(
    action: string, 
    result: any, 
    originalMessage: string, 
    success: boolean = true
  ): Promise<string> {
    try {
      const systemPrompt = `You are Ikigai, a friendly CRM assistant. Generate a natural, conversational response to the user based on the action they requested and the result.

Guidelines:
- Be friendly and professional
- Use emojis sparingly but appropriately
- Keep responses concise but informative
- If successful, confirm what was done
- If failed, explain what went wrong and suggest alternatives
- Use the user's original language style

Examples:
Action: create_company, Success: true, Result: {name: "TechCorp", id: "123"}
Response: "✅ Great! I've successfully created TechCorp as a new client in your CRM. The company has been assigned ID 123 and is ready for contacts and deals."

Action: create_deal, Success: false, Result: {error: "Company not found"}
Response: "❌ I couldn't create that deal because the company doesn't exist yet. Would you like me to create the company first, or did you mean a different company name?"

Action: get_companies, Success: true, Result: [{name: "TechCorp"}, {name: "StartupXYZ"}]
Response: "Here are your companies:\n📊 TechCorp\n📊 StartupXYZ\n\nWould you like more details about any of these?"

Respond naturally and conversationally.`;

      const userPrompt = `
Original user message: "${originalMessage}"
Action performed: ${action}
Success: ${success}
Result: ${JSON.stringify(result)}

Generate an appropriate response:`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || 'I processed your request, but I\'m having trouble generating a response right now.';

    } catch (error) {
      console.error('Error generating response:', error);
      return success 
        ? 'Your request was processed successfully!'
        : 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }
}

export default OpenAIService;