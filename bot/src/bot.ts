import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAIService from './services/openaiService.js';
import CRMExecutor from './services/crmExecutor.js';

// Load environment variables
dotenv.config({ path: '../.env.local' });

// Get directory paths for serving static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../../dist');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BOT_SERVER_PORT = process.env.BOT_SERVER_PORT || 3001;
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required in .env.local');
  process.exit(1);
}

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required in .env.local');
  process.exit(1);
}

// Initialize services
const openaiService = new OpenAIService(OPENAI_API_KEY);
const crmExecutor = new CRMExecutor();

// Initialize Telegram bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { 
  polling: !WEBHOOK_URL // Use polling if no webhook URL is provided
});

// Initialize Express server for webhooks (if needed)
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(distPath));

// API routes for bot
app.use('/api', express.Router());

// Bot message handler
const handleMessage = async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const messageText = msg.text;

  if (!messageText) {
    await bot.sendMessage(chatId, 'I can only process text messages. Please send me a text message with your request.');
    return;
  }

  console.log(`📨 Received message from ${msg.from?.username || msg.from?.first_name}: ${messageText}`);

  try {
    // Send typing indicator
    await bot.sendChatAction(chatId, 'typing');

    // Step 1: Parse the message with OpenAI
    console.log('🤖 Analyzing message with OpenAI...');
    const intent = await openaiService.parseUserMessage(messageText);
    console.log('📋 Parsed intent:', JSON.stringify(intent, null, 2));

    // Step 2: Execute the CRM action
    console.log('⚙️ Executing CRM action...');
    const result = await crmExecutor.executeAction(intent);
    console.log('✅ CRM action result:', JSON.stringify(result, null, 2));

    // Step 3: Generate natural language response
    console.log('💬 Generating response...');
    const response = await openaiService.generateResponse(
      intent.action,
      result.data || result.error,
      messageText,
      result.success
    );

    // Step 4: Send response back to user
    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });

    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('❌ Error processing message:', error);
    await bot.sendMessage(
      chatId, 
      'Sorry, I encountered an error processing your request. Please try again or contact support.',
      { parse_mode: 'Markdown' }
    );
  }
};

// Bot event handlers
bot.on('message', handleMessage);

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

// Welcome message handler
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 **Welcome to Ikigai CRM Bot!**

I'm your AI-powered CRM assistant. I can help you:

✅ Create companies, contacts, deals, and projects
✅ Search and retrieve CRM data  
✅ Log time entries
✅ Get insights about your business

**Examples:**
• "Create a new client called TechCorp"
• "Add John Smith as contact for TechCorp"
• "Create a $50k software development deal"
• "Show me all deals above $10000"
• "Log 3 hours working on website design"

Just send me a message in natural language and I'll understand! 

Type /help for more commands.
  `;
  
  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Help command handler
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const helpResult = await crmExecutor.executeAction({
    action: 'help',
    entities: {},
    confidence: 1,
    originalMessage: '/help'
  });
  
  await bot.sendMessage(chatId, helpResult.message || 'Help information not available.', { 
    parse_mode: 'Markdown' 
  });
});

// Webhook setup (if webhook URL is provided)
if (WEBHOOK_URL) {
  app.post(`/bot${TELEGRAM_BOT_TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  // Set webhook
  bot.setWebHook(`${WEBHOOK_URL}/bot${TELEGRAM_BOT_TOKEN}`)
    .then(() => {
      console.log('✅ Webhook set successfully');
    })
    .catch((error) => {
      console.error('❌ Error setting webhook:', error);
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    botMode: WEBHOOK_URL ? 'webhook' : 'polling'
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start the server
app.listen(BOT_SERVER_PORT, () => {
  console.log(`
🚀 **Ikigai CRM Bot Server Started**

📡 Server running on port: ${BOT_SERVER_PORT}
🤖 Bot mode: ${WEBHOOK_URL ? 'Webhook' : 'Polling'}
🔑 OpenAI API: ${OPENAI_API_KEY ? '✅ Connected' : '❌ Missing'}
📱 Telegram Token: ${TELEGRAM_BOT_TOKEN ? '✅ Connected' : '❌ Missing'}

${WEBHOOK_URL ? `🌐 Webhook URL: ${WEBHOOK_URL}` : '📡 Using long polling for development'}

💡 Bot is ready to receive messages!
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot server...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot server...');
  bot.stopPolling();
  process.exit(0);
});

export default bot;