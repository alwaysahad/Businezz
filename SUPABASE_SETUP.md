# Supabase Setup Guide

This guide will help you set up Supabase for multi-device synchronization in your Invoice Generator application.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Basic understanding of SQL databases
- Your invoice generator application code

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: Invoice Generator (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your users
   - **Pricing Plan**: Free tier is fine for getting started
4. Click **"Create new project"**
5. Wait for the project to be provisioned (takes 1-2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click **"New Query"**
3. Copy the entire contents of `/database/schema.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"** or press `Ctrl/Cmd + Enter`
6. You should see a success message indicating all tables, indexes, and policies were created

### What This Creates

The schema creates:
- **5 tables**: invoices, customers, products, business_profile, settings
- **Row Level Security (RLS)** policies to ensure users only see their own data
- **Indexes** for fast queries
- **Triggers** for automatic timestamp updates
- **Real-time subscriptions** for live sync

## Step 3: Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled (it should be by default)
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation and password reset emails if desired

### Email Confirmation Settings

By default, Supabase requires email confirmation. For development:

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**, you can toggle **"Enable email confirmations"**
3. For development, you might want to disable this temporarily
4. For production, keep it enabled for security

## Step 4: Get Your API Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. You'll see two important values:
   - **Project URL**: Looks like `https://xxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
3. **DO NOT** share your `service_role` key - it bypasses all security!

## Step 5: Configure Your Application

1. In your project root, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Important**: Add `.env` to your `.gitignore` (it should already be there)

## Step 6: Test the Connection

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your application in a browser

3. Try to sign up with a new account:
   - Go to `/signup`
   - Enter an email and password
   - Click "Create Account"

4. Check your Supabase dashboard:
   - Go to **Authentication** → **Users**
   - You should see your new user listed

5. Try creating an invoice:
   - Create a new invoice in the app
   - Go to Supabase **Table Editor** → **invoices**
   - You should see your invoice data

## Step 7: Test Multi-Device Sync

1. **Device A**: Sign in to your account
2. **Device B**: Open the app in a different browser or incognito window
3. **Device B**: Sign in with the same account
4. **Device A**: Create a new invoice
5. **Device B**: The invoice should appear automatically (within seconds)

## Troubleshooting

### "User not authenticated" errors

- Make sure you're signed in
- Check browser console for auth errors
- Verify your Supabase URL and anon key are correct

### Data not syncing

1. Check if real-time is enabled:
   - Go to **Database** → **Replication**
   - Ensure tables are published to `supabase_realtime`

2. Check RLS policies:
   - Go to **Authentication** → **Policies**
   - Ensure policies exist for all tables

3. Check browser console for errors

### Email confirmation not working

- Check **Authentication** → **Email Templates**
- Verify your email provider settings
- For development, consider disabling email confirmation

### "Row Level Security" errors

This means RLS is blocking access. Verify:
1. You're signed in
2. The `user_id` column matches your user ID
3. RLS policies are correctly set up (re-run the schema if needed)

## Production Deployment

### Environment Variables

When deploying to production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. Rebuild your application

### Security Checklist

- ✅ RLS policies are enabled on all tables
- ✅ Email confirmation is enabled
- ✅ Strong password requirements are enforced
- ✅ `.env` file is in `.gitignore`
- ✅ Only using `anon` key in frontend (never `service_role`)

### Custom Domain (Optional)

You can set up a custom domain for your Supabase project:
1. Go to **Settings** → **Custom Domains**
2. Follow the instructions to add your domain

## Monitoring and Limits

### Free Tier Limits

- **Database**: 500 MB
- **Storage**: 1 GB
- **Bandwidth**: 2 GB
- **Monthly Active Users**: Unlimited

### Monitoring Usage

1. Go to **Settings** → **Usage**
2. Monitor your database size, API requests, and bandwidth
3. Upgrade to Pro if you exceed limits

## Backup and Export

### Automatic Backups

Supabase Pro includes automatic daily backups. On the free tier:

1. Go to **Database** → **Backups**
2. You can manually create backups
3. Download backups as needed

### Export Data

To export your data:

```sql
-- In SQL Editor
COPY (SELECT * FROM invoices) TO STDOUT WITH CSV HEADER;
```

Or use the Supabase CLI:
```bash
supabase db dump -f backup.sql
```

## Next Steps

- Set up email templates for your brand
- Configure password reset flow
- Add user profile management
- Set up analytics (optional)
- Consider upgrading to Pro for production

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

**Need Help?** Check the main README.md for application-specific documentation.
