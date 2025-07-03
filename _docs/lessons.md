# Lessons Learned: Friend's Tracked Games Not Appearing

## Problem Summary

The "View Games" feature for a friend was not displaying their tracked games, even when it was confirmed that the friend had games tracked in the database. The application would fail silently, showing an empty list of games without any clear error message. Initial investigation ruled out front-end state management issues and pointed towards a data-fetching problem.

## Diagnostic Process

1.  **Initial Analysis:** The data flow on the client-side was traced from the button click in `FriendCard` to the `FriendGamesView` component. State and props were being passed correctly.
2.  **API Service Check:** The `getFriendTrackedGames` function in `friends-service.ts` was identified as the core function responsible for fetching the data.
3.  **Logging:** To get more visibility, we added detailed `console.log` statements to the `getFriendTrackedGames` function. This allowed us to inspect the `friendId` being passed, the result of the friendship verification query, and the final data returned from the `tracked_games` table query.
4.  **Log Analysis:** The logs revealed that the friendship check was successful, but the final query to fetch the games was returning an empty array (`[]`), despite the games existing in the database for that user.
5.  **Root Cause Identification:** This behavior (a query returning no rows without an error) is a classic symptom of a Row-Level Security (RLS) policy issue. The user performing the query did not have the required permissions to view the rows in the `tracked_games` table that belonged to another user.
6.  **RLS Investigation:** We inspected the project's SQL migrations and discovered that while RLS was enabled for `friends` and `friend_requests`, the `tracked_games` table had no RLS policies defined at all.

## Solution

The solution involved creating and applying a new database migration to define the correct RLS policies for the `tracked_games` table.

1.  **New Migration File:** A new file, `prisma/migrations/add_rls_for_tracked_games.sql`, was created.
2.  **RLS Policies:** The migration contained two key policies:
    *   A policy allowing users to perform all actions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on their *own* tracked games.
    *   A policy allowing users `SELECT` (read-only) access to the tracked games of another user, but only if a friendship exists between them in the `friends` table.
3.  **Idempotency:** The script was made idempotent by wrapping the `CREATE POLICY` statements in `DO $$ ... END $$;` blocks with `IF NOT EXISTS` checks. This ensures the migration can be run multiple times without causing errors if the policies already exist.
4.  **Application:** The final, robust migration was applied to the database using the available MCP tool, which successfully updated the RLS rules and resolved the issue. 