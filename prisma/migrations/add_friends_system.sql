-- Migration: Add Friends System
-- This migration adds the missing friends system tables and user profile fields

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;

-- Add unique constraint to username if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
        ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- Create enums for friends system (using DO blocks to check existence)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
        CREATE TYPE friend_request_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shared_content_type') THEN
        CREATE TYPE shared_content_type AS ENUM ('NEWS_ITEM', 'ARTICLE', 'GAME_SUGGESTION');
    END IF;
END $$;

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_friendship UNIQUE(user_id, friend_id)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friend_request_status DEFAULT 'PENDING',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_friend_request UNIQUE(sender_id, receiver_id)
);

-- Create shared_content table
CREATE TABLE IF NOT EXISTS shared_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type shared_content_type NOT NULL,
    content_id UUID NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_shared_content_shared_by ON shared_content(shared_by);
CREATE INDEX IF NOT EXISTS idx_shared_content_shared_with ON shared_content(shared_with);
CREATE INDEX IF NOT EXISTS idx_shared_content_read ON shared_content(read);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Enable RLS on new tables
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friends table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own friends' AND tablename = 'friends') THEN
        CREATE POLICY "Users can view their own friends" ON friends FOR SELECT USING (user_id = auth.uid() OR friend_id = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create friendships' AND tablename = 'friends') THEN
        CREATE POLICY "Users can create friendships" ON friends FOR INSERT WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their friendships' AND tablename = 'friends') THEN
        CREATE POLICY "Users can update their friendships" ON friends FOR UPDATE USING (user_id = auth.uid() OR friend_id = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their friendships' AND tablename = 'friends') THEN
        CREATE POLICY "Users can delete their friendships" ON friends FOR DELETE USING (user_id = auth.uid() OR friend_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for friend_requests table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own friend requests' AND tablename = 'friend_requests') THEN
        CREATE POLICY "Users can view their own friend requests" ON friend_requests FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send friend requests' AND tablename = 'friend_requests') THEN
        CREATE POLICY "Users can send friend requests" ON friend_requests FOR INSERT WITH CHECK (sender_id = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own friend requests' AND tablename = 'friend_requests') THEN
        CREATE POLICY "Users can update their own friend requests" ON friend_requests FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own friend requests' AND tablename = 'friend_requests') THEN
        CREATE POLICY "Users can delete their own friend requests" ON friend_requests FOR DELETE USING (sender_id = auth.uid() OR receiver_id = auth.uid());
    END IF;
END $$;

-- Create RLS policies for shared_content table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view content shared with them' AND tablename = 'shared_content') THEN
        CREATE POLICY "Users can view content shared with them" ON shared_content FOR SELECT USING (shared_by = auth.uid() OR shared_with = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can share content' AND tablename = 'shared_content') THEN
        CREATE POLICY "Users can share content" ON shared_content FOR INSERT WITH CHECK (shared_by = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update shared content they received' AND tablename = 'shared_content') THEN
        CREATE POLICY "Users can update shared content they received" ON shared_content FOR UPDATE USING (shared_with = auth.uid());
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete content they shared' AND tablename = 'shared_content') THEN
        CREATE POLICY "Users can delete content they shared" ON shared_content FOR DELETE USING (shared_by = auth.uid());
    END IF;
END $$;

-- Update the users table RLS policies to allow user search
DO $$ 
BEGIN
    -- Drop old restrictive policy if it exists
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only view their own data' AND tablename = 'users') THEN
        DROP POLICY "Users can only view their own data" ON users;
    END IF;
    
    -- Create new policies for user search functionality
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own data' AND tablename = 'users') THEN
        CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view basic profile info of other users' AND tablename = 'users') THEN
        CREATE POLICY "Users can view basic profile info of other users" ON users FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'users') THEN
        CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (id = auth.uid());
    END IF;
END $$; 