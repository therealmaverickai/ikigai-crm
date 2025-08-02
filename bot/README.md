# 🤖 Ikigai CRM Telegram Bot

AI-powered Telegram bot that integrates with your Ikigai CRM system using OpenAI for natural language understanding.

## ✨ Features

- **Natural Language Processing**: Send commands in plain English
- **CRM Operations**: Create companies, contacts, deals, projects, and time entries
- **Data Retrieval**: Search and filter your CRM data
- **AI Responses**: Get natural, conversational replies
- **Real-time Integration**: Direct connection to your Supabase database

## 🚀 Setup Instructions

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Choose a name and username for your bot
4. Copy the **Bot Token** you receive

### 2. Get OpenAI API Key

1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the API key

### 3. Configure Environment Variables

Update your `.env.local` file in the project root:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_WEBHOOK_URL=your_webhook_url_here  # Optional, for production

# OpenAI API Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Bot Server Configuration
BOT_SERVER_PORT=3001
```

### 4. Install Dependencies

```bash
cd bot
npm install
```

### 5. Start the Bot

**Development mode:**
```bash
npm run bot
```

**Or from project root:**
```bash
npm run bot
```

## 📱 Usage Examples

Once your bot is running, you can send these types of messages:

### Create Operations
- "Create a new client called TechCorp"
- "Add John Smith as contact for TechCorp with email john@techcorp.com"
- "Create a $50,000 software development deal for TechCorp"
- "Create project Website Redesign for TechCorp"
- "Log 3 hours working on website design today"

### Search Operations
- "Show me all companies"
- "Find all contacts"
- "Show deals above $10,000"
- "List active projects"
- "Show recent time entries"

### Help
- `/start` - Welcome message
- `/help` - Full command list
- "help" - Natural language help

## 🏗️ Architecture

```
User Message → Telegram Bot → OpenAI Analysis → CRM Executor → Supabase → OpenAI Response → User
```

1. **Message Reception**: Bot receives user message
2. **Intent Analysis**: OpenAI parses the message to understand intent and extract entities
3. **Action Execution**: CRM executor performs the requested action using Supabase API
4. **Response Generation**: OpenAI generates a natural language response
5. **Reply**: Bot sends the response back to the user

## 🔧 Configuration

### Polling vs Webhooks

- **Development**: Uses polling (default)
- **Production**: Set `TELEGRAM_WEBHOOK_URL` for webhook mode

### OpenAI Model

The bot uses `gpt-4o-mini` for:
- Message understanding and intent parsing
- Natural language response generation
- Cost-effective operation

## 🛠️ Development

### File Structure

```
bot/
├── src/
│   ├── services/
│   │   ├── openaiService.ts     # OpenAI integration
│   │   └── crmExecutor.ts       # CRM operations
│   └── bot.ts                   # Main bot server
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Commands

1. Update `ParsedIntent` interface in `openaiService.ts`
2. Add new action cases in `crmExecutor.ts`
3. Update OpenAI system prompt to recognize new commands

## 🔒 Security

- API keys stored in environment variables
- No sensitive data logged
- Bot token protected
- Supabase RLS can be enabled for multi-tenant support

## 🚨 Troubleshooting

### Bot not responding
- Check if `TELEGRAM_BOT_TOKEN` is correct
- Verify bot is running: `npm run bot`
- Check console logs for errors

### OpenAI errors
- Verify `OPENAI_API_KEY` is valid
- Check OpenAI API usage limits
- Ensure you have credits available

### CRM operations failing
- Verify Supabase connection
- Check if required tables exist in database
- Review Supabase API credentials

## 📊 Monitoring

The bot logs all operations to console:
- Message reception
- OpenAI analysis results
- CRM execution results
- Response generation

Monitor these logs to debug issues and track usage.

## 🌐 Production Deployment

For production deployment:

1. Set up webhook URL (use ngrok for testing)
2. Configure `TELEGRAM_WEBHOOK_URL` in environment
3. Deploy to cloud service (Heroku, Railway, etc.)
4. Ensure Supabase and OpenAI API access

## 💡 Tips

- Use natural language - the AI understands context
- Be specific with company names and amounts
- Check `/help` for full command reference
- Test with simple commands first

Enjoy your AI-powered CRM assistant! 🎉