-- Migration: Clean up rejected and cancelled friend requests
-- This allows users to send new friend requests after rejections

-- Delete old rejected and cancelled requests to allow new ones
-- Keep only PENDING and ACCEPTED requests for history
DELETE FROM friend_requests 
WHERE status IN ('REJECTED', 'CANCELLED') 
AND created_at < NOW() - INTERVAL '7 days';

-- Create a function to automatically clean up old rejected/cancelled requests
CREATE OR REPLACE FUNCTION cleanup_old_friend_requests()
RETURNS void AS $$
BEGIN
    DELETE FROM friend_requests 
    WHERE status IN ('REJECTED', 'CANCELLED') 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup weekly (if pg_cron is available)
-- SELECT cron.schedule('cleanup-friend-requests', '0 0 * * 0', 'SELECT cleanup_old_friend_requests();'); 