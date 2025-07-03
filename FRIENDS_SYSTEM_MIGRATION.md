# Friends System Migration

## Problem

The friends system code was implemented but the database schema was not migrated. This is why the user search is failing - the database is missing:

1. User profile fields: `username`, `display_name`, `avatar_url`
2. Friends system tables: `friends`, `friend_requests`, `shared_content`
3. Required enums: `friend_request_status`, `shared_content_type`

## Solution

Apply the migration file to your Supabase database.

## Steps to Apply Migration

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `prisma/migrations/add_friends_system.sql`
4. Paste it into the SQL Editor
5. Run the migration

### Option 2: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push

# Or apply the migration directly
psql -h <your-db-host> -U <your-db-user> -d <your-db-name> -f prisma/migrations/add_friends_system.sql
```

### Option 3: Using Direct Database Connection
If you have direct database access, you can run the SQL file directly against your PostgreSQL database.

## After Migration

1. The user search will work correctly
2. Users can set their username, display name, and avatar
3. All friends system features will be functional
4. The debug component can be removed from the Friends page

## Testing

After applying the migration, test that:
1. User search returns results for different users
2. Users can set their profile information
3. Friend requests can be sent and received
4. Content sharing works properly

## Files Modified

- `prisma/migrations/add_friends_system.sql` - The main migration file (updated with correct RLS policies)
- `prisma/migrations/cleanup_rejected_requests.sql` - Cleanup migration for rejected requests
- `prisma/migrations/fix_friends_rls_policy.sql` - Fix for existing databases with incorrect RLS policies
- This will update your database schema to match the Prisma schema in `prisma/schema.prisma`

## Apply Migrations

### For New Database (hasn't run any migrations yet)
Just run the main migration (it now has the correct RLS policies):

#### Using Supabase Dashboard
1. Run `add_friends_system.sql`
2. Run `cleanup_rejected_requests.sql`

#### Using Supabase CLI
```bash
supabase db push --file prisma/migrations/add_friends_system.sql
supabase db push --file prisma/migrations/cleanup_rejected_requests.sql
```

### For Existing Database (already ran the main migration)
If you're getting "New row violates row-level security policy for 'friends'" errors, run the RLS fix:

#### Using Supabase Dashboard
1. Run `fix_friends_rls_policy.sql`
2. Run `cleanup_rejected_requests.sql` (if not already run)

#### Using Supabase CLI
```bash
supabase db push --file prisma/migrations/fix_friends_rls_policy.sql
supabase db push --file prisma/migrations/cleanup_rejected_requests.sql
```

## Note

The migration uses `IF NOT EXISTS` clauses to be safe to run multiple times. However, it's recommended to run it only once on a clean database state. 