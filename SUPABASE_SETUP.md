# Supabase Cloud Database Setup

This guide will help you connect your CRM application to Supabase for cloud data storage.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: Your CRM Project
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"
6. Wait for the project to be provisioned (2-3 minutes)

## Step 2: Get Your Project Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://abc123.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 4: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## Step 5: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `src/database/supabaseSchema.sql`
4. Click "Run" to create all tables

## Step 6: Enable Real-time (Optional)

If you want real-time updates across multiple users:

1. Go to **Database** → **Replication** in Supabase dashboard
2. Enable replication for these tables:
   - `companies`
   - `contacts` 
   - `deals`
   - `projects`
   - `time_entries`

## Step 7: Update Your Store (Next Step)

To integrate Supabase with your existing Zustand store, you'll need to:

1. Update `src/stores/crmStoreDb.ts` to use `supabaseApi` instead of localStorage
2. Add error handling for network requests
3. Add loading states for async operations
4. Optionally add real-time subscriptions

## Step 8: Test the Connection

After setup, you can test the connection by:

1. Starting your dev server: `npm run dev`
2. Opening browser dev tools
3. Adding a company/project and checking the Supabase dashboard to see if data appears

## Security Notes

- The anon key is safe to use in client-side code
- Row Level Security (RLS) is commented out in the schema but can be enabled for multi-tenant support
- For production, consider setting up authentication with Supabase Auth

## Data Migration

Your existing localStorage data won't automatically migrate. You have a few options:

1. **Export/Import**: Use your current export feature, then manually import the JSON to Supabase
2. **Dual Mode**: Keep both localStorage and Supabase until you're satisfied with cloud functionality
3. **Fresh Start**: Start with a clean cloud database

## Costs

Supabase offers:
- **Free tier**: 500MB database, 2GB bandwidth, 50MB file storage
- **Pro tier**: $25/month for 8GB database, 250GB bandwidth, 100GB storage
- **Pay-as-you-scale**: Additional usage charged incrementally

For a personal CRM, the free tier should be sufficient initially.

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- Check the browser console for any connection errors