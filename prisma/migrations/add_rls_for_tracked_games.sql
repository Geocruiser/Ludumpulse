-- Migration: Add RLS policies for tracked_games
-- This migration enables RLS on the tracked_games table and adds policies
-- to allow users to view their own games and their friends' games.

-- Enable RLS on the tracked_games table if not already enabled.
-- NOTE: This command is idempotent and will not throw an error if already enabled.
ALTER TABLE tracked_games ENABLE ROW LEVEL SECURITY;

-- Allow users to perform all actions on their own tracked games
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own tracked games' AND tablename = 'tracked_games') THEN
    CREATE POLICY "Users can manage their own tracked games"
    ON tracked_games
    FOR ALL
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Allow users to view the tracked games of their friends
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their friends tracked games' AND tablename = 'tracked_games') THEN
    CREATE POLICY "Users can view their friends tracked games"
    ON tracked_games
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM friends
        WHERE
          (friends.user_id = tracked_games.user_id AND friends.friend_id = auth.uid()) OR
          (friends.friend_id = tracked_games.user_id AND friends.user_id = auth.uid())
      )
    );
  END IF;
END $$; 