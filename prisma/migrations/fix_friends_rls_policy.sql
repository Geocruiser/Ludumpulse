-- Migration: Fix RLS policy for friends table
-- This fixes the issue where bidirectional friendships cannot be created

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can manage their own friendships" ON friends;

-- Create separate policies for different operations
-- Allow users to insert friendships where they are either the user or the friend
CREATE POLICY "Users can create friendships" ON friends FOR INSERT 
WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

-- Allow users to update friendships where they are involved
CREATE POLICY "Users can update their friendships" ON friends FOR UPDATE 
USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Allow users to delete friendships where they are involved
CREATE POLICY "Users can delete their friendships" ON friends FOR DELETE 
USING (user_id = auth.uid() OR friend_id = auth.uid()); 