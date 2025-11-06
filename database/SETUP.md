# Database Setup Instructions

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `usac-rhc-automation`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is sufficient for development
5. Click "Create new project" (takes ~2 minutes to provision)

## Step 2: Run the Schema Script

### Option A: Via Supabase Dashboard (Easiest)

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `schema.sql` from this directory
4. Paste into the SQL editor
5. Click "Run" (bottom right)
6. Verify success: You should see "Success. No rows returned"

### Option B: Via Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the schema
supabase db push

# Or run the SQL file directly
psql -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres -f schema.sql
```

## Step 3: Verify Tables Were Created

1. In Supabase dashboard, go to **Table Editor** (left sidebar)
2. You should see 3 tables:
   - `clinics_pending_review`
   - `usac_historical_filings`
   - `system_alerts`
3. You should also see 2 views:
   - `high_priority_pending`
   - `clinic_stats`

## Step 4: Get Your API Keys

1. In Supabase dashboard, go to **Project Settings** (gear icon, left sidebar)
2. Click **API** in the settings menu
3. Copy these values (you'll need them later):

```
Project URL: https://YOUR_PROJECT_REF.supabase.co
anon public key: eyJhbG... (long string)
service_role key: eyJhbG... (long string - keep this secret!)
```

## Step 5: Generate TypeScript Types

```bash
# Navigate to dashboard directory (when created)
cd ../dashboard

# Generate types
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.types.ts
```

Or get your Project ID:
1. Settings ’ General ’ Reference ID

Then run:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_REF > types.ts
```

## Step 6: Configure Environment Variables

### For n8n Workflows

Add these to your n8n environment variables:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

### For Next.js Dashboard (when created)

Create `.env.local` in dashboard directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key_here
```

## Testing the Database

### Test 1: Insert Sample Data

Run this in SQL Editor to insert test clinic:

```sql
insert into public.clinics_pending_review (
  hcp_number,
  clinic_name,
  address,
  city,
  state,
  filing_date,
  form_465_hash,
  priority_score,
  priority_label,
  total_funding_3y,
  location_count,
  participation_years
) values (
  'HCP001234',
  'Springfield Community Health Center',
  '123 Main St',
  'Springfield',
  'IL',
  now() - interval '1 day',
  'test_hash_' || gen_random_uuid()::text,
  85,
  'High',
  250000.00,
  3,
  2
);
```

### Test 2: Query Sample Data

```sql
-- View all clinics
select * from clinics_pending_review;

-- View high priority pending
select * from high_priority_pending;

-- View clinic stats
select * from clinic_stats;
```

### Test 3: Test RLS Policies

```sql
-- Should work (authenticated)
select * from clinics_pending_review;

-- Test update trigger
update clinics_pending_review
set enriched = true
where hcp_number = 'HCP001234';

-- Check updated_at was automatically set
select updated_at from clinics_pending_review where hcp_number = 'HCP001234';
```

## Troubleshooting

### "Extension uuid-ossp already exists"
- This is fine, it means the extension was already installed
- The script uses `if not exists` to handle this safely

### "Permission denied"
- Make sure you're using the service_role key for n8n workflows
- For dashboard queries, the anon key with RLS policies should work

### "Table already exists"
- If you need to start fresh: Go to SQL Editor and run:
  ```sql
  drop table if exists clinics_pending_review cascade;
  drop table if exists usac_historical_filings cascade;
  drop table if exists system_alerts cascade;
  ```
- Then re-run the schema.sql

### TypeScript type generation fails
- Make sure you have the correct project reference ID
- Install Supabase CLI globally: `npm install -g supabase`
- Try logging in again: `supabase login`

## Next Steps

After database setup is complete:

1.  Database schema created
2.  API keys saved
3. ¡ **Next**: Phase 2 - n8n Workflow Implementation
4. See `../PROGRESS.md` for the full checklist

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Text Search](https://www.postgresql.org/docs/current/textsearch.html)
