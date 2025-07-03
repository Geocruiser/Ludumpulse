# 🧹 News Article Cleanup System

## Overview
To prevent database bloat, this app automatically manages news article storage with a 4-day retention policy. Articles older than 4 days are automatically cleaned up to keep the database lean and performant.

## How It Works

### Automatic Cleanup
- **On App Startup**: Cleans up articles older than 4 days every time you open the app
- **During News Updates**: When you click "Update Game News", old articles are cleaned up before scraping new ones
- **Retention Period**: 4 days (configurable)

### Manual Cleanup
- **Cleanup Button**: On the News page, there's a "Cleanup" button to manually remove old articles
- **Status Feedback**: Shows how many articles were removed
- **Safe Operation**: Won't break anything if no old articles exist

## Benefits
- ✅ **Prevents Database Bloat**: Keeps your database size manageable
- ✅ **Maintains Performance**: Faster queries with fewer records
- ✅ **Always Fresh**: Focus on recent, relevant news
- ✅ **Automatic**: No manual maintenance required
- ✅ **Configurable**: Can adjust retention period if needed

## Customization

### Change Retention Period
If you want to keep articles longer or shorter, you can modify the cleanup functions:

```typescript
// In database.ts - change default from 4 to your preferred days
export async function cleanupOldNews(olderThanDays: number = 7): Promise<...>

// In news-service.ts - change the scraping cleanup
const cleanupResult = await cleanupOldNews(7) // 7 days instead of 4
```

### Manual Cleanup Via Code
```typescript
import { cleanupOldNews } from '@/lib/database'

// Clean up articles older than 3 days
const result = await cleanupOldNews(3)
console.log(`Deleted ${result.data?.deletedCount} articles`)
```

## Monitoring
Check your browser console for cleanup messages:
- `🧹 Cleaned up X old news articles`
- `✅ Database clean - no old articles to remove`
- `⚠️ Failed to cleanup old articles` (if there's an error)

## Notes
- Cleanup operations are **safe** and won't affect your tracked games or other data
- Only affects the `news_items` table
- Cleanup failures won't break the app - news scraping continues normally
- The system is designed to be maintenance-free

---

**Result**: Your news database stays clean automatically while keeping the most recent 4 days of articles! 🎉 