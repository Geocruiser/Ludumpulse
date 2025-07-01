# Supabase MCP Setup Guide for Ludumpulse

This guide will help you complete the Supabase MCP setup for your AI-powered game news tracking app.

## Prerequisites Completed ✅
- [x] Created `.cursor/mcp.json` configuration file
- [x] Added basic MCP server configuration

## Next Steps Required

### 1. Create/Access Your Supabase Project

If you don't have a Supabase project yet:
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/sign in to your account
3. Click "New Project"
4. Choose your organization
5. Name your project (e.g., "ludumpulse")
6. Set a database password (save this!)
7. Choose a region closest to you
8. Click "Create new project"

### 2. Get Your Project Reference

1. In your Supabase dashboard, go to **Settings** → **General**
2. Find your **Project URL**: `https://YOUR_PROJECT_REF.supabase.co`
3. Copy the `YOUR_PROJECT_REF` part (it's the subdomain)

### 3. Create a Personal Access Token

1. In Supabase, click your avatar (top right)
2. Go to **Account Settings**
3. Navigate to **Access Tokens** tab
4. Click **Generate new token**
5. Name it something like "Ludumpulse MCP Server"
6. Copy the token (you won't see it again!)

### 4. Update Your Configuration

Edit `.cursor/mcp.json` and replace:
- `YOUR_PROJECT_REF_HERE` with your actual project reference
- `YOUR_PERSONAL_ACCESS_TOKEN_HERE` with your personal access token

### 5. Test the Connection

1. Save the configuration file
2. Restart Cursor
3. Go to **Settings** → **MCP** in Cursor
4. You should see the Supabase server with a green "Active" status
5. Try asking Cursor: "Can you show me my Supabase project information?"

## Database Schema for Ludumpulse

Based on your PRD, you'll need these tables:

```sql
-- Users table (handled by Supabase Auth)

-- Tracked Games
CREATE TABLE tracked_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tags TEXT[],
  release_status TEXT CHECK (release_status IN ('released', 'unreleased')),
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- News Items
CREATE TABLE news_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES tracked_games(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  full_article_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Suggestions
CREATE TABLE game_suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_title TEXT NOT NULL,
  justification TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES tracked_games(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

Enable RLS and create policies to isolate user data:

```sql
-- Enable RLS
ALTER TABLE tracked_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for tracked_games
CREATE POLICY "Users can manage their own tracked games" ON tracked_games
FOR ALL USING (auth.uid() = user_id);

-- Policies for news_items (through game ownership)
CREATE POLICY "Users can view news for their tracked games" ON news_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tracked_games 
    WHERE tracked_games.id = news_items.game_id 
    AND tracked_games.user_id = auth.uid()
  )
);

-- Similar policies for other tables...
```

## Available MCP Tools

Once configured, you can ask Cursor to:
- Create and manage database tables
- Run SQL queries on your data
- Generate TypeScript types from your schema
- Fetch project configuration
- View and analyze your data
- Create database migrations

## Troubleshooting

If you see connection issues:
1. Verify your project reference is correct
2. Check that your access token is valid
3. Restart Cursor completely
4. Check the MCP server status in Cursor settings

## Security Note

The configuration uses `--read-only` mode by default, which prevents accidental data modifications. Remove this flag if you want full write access (be careful!). 