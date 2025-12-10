
# Livestream Replays & Leaderboards System Implementation

## Overview

This document describes the implementation of the Livestream Replay System and the comprehensive Leaderboards System for the Roast Live app.

---

## 📹 Livestream Replay System

### Database Schema

The `stream_replays` table stores replay metadata:

```sql
- id: UUID (primary key)
- stream_id: UUID (references streams)
- creator_id: UUID (references profiles)
- replay_url: TEXT (HLS playlist URL from Cloudflare Stream)
- thumbnail_url: TEXT (optional thumbnail)
- total_duration_seconds: INTEGER
- started_at: TIMESTAMPTZ
- ended_at: TIMESTAMPTZ
- title: TEXT
- views_count: INTEGER
- likes_count: INTEGER
- comments_count: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Features

1. **Automatic Replay Creation**
   - When a stream ends, the HLS recording URL from Cloudflare Stream is automatically saved
   - Replay metadata is stored in the `stream_replays` table
   - Analytics record is created for tracking views and engagement

2. **Replay Management**
   - Creators can view all their saved replays in the "Saved Streams" screen
   - Creators can delete replays they no longer want to keep
   - Replays include thumbnail, duration, views, likes, and comments count

3. **Replay Viewing**
   - Users can watch replays with full HLS playback
   - View tracking with watch duration and completion percentage
   - Like and comment functionality
   - Analytics tracking for engagement metrics

4. **Replay Analytics**
   - Total views
   - Average watch percentage
   - New followers gained from replay
   - Peak concurrent viewers
   - Most watched timestamp

### Service: `replayService.ts`

**Key Methods:**
- `createReplay()` - Create a replay from a stream
- `getReplay()` - Get replay by ID
- `getCreatorReplays()` - Get all replays for a creator
- `deleteReplay()` - Delete a replay
- `trackView()` - Track a replay view
- `getComments()` - Get replay comments
- `addComment()` - Add a comment to a replay
- `likeReplay()` - Like a replay
- `unlikeReplay()` - Unlike a replay
- `getAnalytics()` - Get replay analytics

### UI Components

**SavedStreamsScreen** (`app/screens/SavedStreamsScreen.tsx`)
- Displays all saved replays for the current user
- Shows thumbnail, title, duration, views, likes
- Delete functionality
- Pull-to-refresh

**ReplayPlayerScreen** (`app/screens/ReplayPlayerScreen.tsx`)
- Full-screen HLS video player
- Like and comment functionality
- View tracking
- Share functionality

---

## 🏆 Leaderboards System

### Database Schema

The `leaderboard_snapshots` table stores daily/weekly/monthly leaderboard data:

```sql
- id: UUID (primary key)
- snapshot_date: DATE
- period_type: TEXT ('daily', 'weekly', 'monthly')
- leaderboard_type: TEXT (see types below)
- user_id: UUID (references profiles)
- rank: INTEGER
- score: NUMERIC
- metadata: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Leaderboard Types

1. **Top Creators (Gifts Received)** - `top_creators_gifts`
   - Ranks creators by total gifts received
   - Score = Total SEK received from gifts

2. **Top Fans (Gifts Sent)** - `top_fans_gifts`
   - Ranks fans by total gifts sent
   - Score = Total SEK spent on gifts

3. **Most Active (Comments & Likes)** - `most_active_comments`
   - Ranks users by engagement activity
   - Score = (Comments × 2) + Likes

4. **Fastest Growing (Followers)** - `fastest_growing_followers`
   - Ranks creators by follower growth
   - Score = New followers gained in period

### Calculation Schedule

Leaderboards are calculated automatically via Supabase Edge Function:

- **Daily**: Calculated every day at midnight
- **Weekly**: Calculated every Sunday at midnight
- **Monthly**: Calculated on the 1st of each month at midnight

### Edge Function: `calculate-leaderboards-daily`

This function runs on a cron schedule and:
1. Calculates all leaderboard types for the current period
2. Aggregates data from various tables (gifts, comments, likes, followers)
3. Ranks users based on their scores
4. Saves snapshots to the `leaderboard_snapshots` table
5. Maintains historical data for trend analysis

**Cron Schedule** (to be configured in Supabase):
```
0 0 * * * # Daily at midnight UTC
```

### Service: `leaderboardSnapshotService.ts`

**Key Methods:**
- `getLeaderboard()` - Get leaderboard for a specific period and type
- `getUserRank()` - Get user's rank in a specific leaderboard
- `getUserHistory()` - Get user's historical rankings
- `getAllLeaderboardsTop10()` - Get top 10 for all leaderboard types
- `triggerCalculation()` - Manually trigger leaderboard calculation (admin only)

### UI Components

**LeaderboardScreen** (`app/screens/LeaderboardScreen.tsx`)
- Period selector (Daily, Weekly, Monthly)
- Type selector (Top Creators, Top Fans, Most Active, Fastest Growing)
- User's current rank card (if applicable)
- Top 100 leaderboard with:
  - Medal emojis for top 3 (🥇🥈🥉)
  - User avatars
  - Premium badges
  - Scores formatted appropriately
  - Special styling for top 10
- Pull-to-refresh

### Features

1. **Multiple Time Periods**
   - Daily leaderboards (last 24 hours)
   - Weekly leaderboards (last 7 days)
   - Monthly leaderboards (last 30 days)

2. **Multiple Leaderboard Types**
   - Top Creators by gifts received
   - Top Fans by gifts sent
   - Most Active by comments and likes
   - Fastest Growing by follower growth

3. **User Rank Display**
   - Shows user's current rank if they're on the leaderboard
   - Displays score and total participants
   - Highlighted with gradient background

4. **Visual Hierarchy**
   - Top 3 get medal emojis (🥇🥈🥉)
   - Top 10 get special "TOP X" badges
   - Top 3 have highlighted background
   - Premium users get PRO badge

5. **Real-time Updates**
   - Pull-to-refresh functionality
   - Automatic refresh every 20 seconds (optional)

---

## 🔧 Setup Instructions

### 1. Database Setup

The migration has already been applied. The `leaderboard_snapshots` table is created with:
- Proper indexes for efficient querying
- RLS policies for security
- Unique constraint on (snapshot_date, period_type, leaderboard_type, user_id)

### 2. Edge Function Setup

The `calculate-leaderboards-daily` Edge Function has been deployed. To set up the cron schedule:

1. Go to Supabase Dashboard → Edge Functions
2. Find `calculate-leaderboards-daily`
3. Add a cron trigger:
   - Schedule: `0 0 * * *` (daily at midnight UTC)
   - Or use Supabase's built-in cron functionality

### 3. Initial Calculation

To populate the leaderboards for the first time:

```typescript
import { leaderboardSnapshotService } from '@/app/services/leaderboardSnapshotService';

// Trigger calculation (admin only)
await leaderboardSnapshotService.triggerCalculation();
```

Or call the Edge Function directly:
```bash
curl -X POST https://[your-project].supabase.co/functions/v1/calculate-leaderboards-daily \
  -H "Authorization: Bearer [your-anon-key]"
```

### 4. Replay Creation

To automatically create replays when streams end, integrate with your stream ending logic:

```typescript
import { replayService } from '@/app/services/replayService';

// When stream ends
const result = await replayService.createReplay(
  streamId,
  creatorId,
  hlsPlaylistUrl, // From Cloudflare Stream
  streamTitle,
  startedAt,
  endedAt,
  thumbnailUrl // Optional
);
```

---

## 📊 Analytics & Metrics

### Replay Analytics

Track the following metrics for each replay:
- Total views
- Average watch percentage
- New followers gained
- Peak concurrent viewers
- Most watched timestamp

### Leaderboard Metrics

Track the following for leaderboards:
- User's rank over time
- Score progression
- Position changes (up/down)
- Historical performance

---

## 🎨 UI/UX Features

### Leaderboard Screen

- **Neon Style Design**: Gradient backgrounds, glowing effects
- **Responsive Layout**: Works on all screen sizes
- **Smooth Animations**: Transitions between periods and types
- **Badge System**: Visual indicators for top performers
- **Premium Indicators**: Special badges for premium users

### Saved Streams Screen

- **Grid/List View**: Easy browsing of replays
- **Quick Actions**: Delete, share, view analytics
- **Metadata Display**: Duration, views, likes, date
- **Thumbnail Previews**: Visual representation of content

---

## 🔐 Security & Permissions

### RLS Policies

**leaderboard_snapshots:**
- Anyone can view leaderboard snapshots
- Only admins can insert/update snapshots

**stream_replays:**
- Anyone can view replays
- Only creators can delete their own replays
- Only creators can create replays for their streams

---

## 🚀 Future Enhancements

### Potential Features

1. **Replay Highlights**
   - Auto-generate highlight clips from replays
   - Most-watched moments
   - Best comments

2. **Leaderboard Rewards**
   - Badges for top performers
   - Special perks for top 10
   - Monthly prizes

3. **Advanced Analytics**
   - Viewer retention graphs
   - Engagement heatmaps
   - Demographic insights

4. **Social Features**
   - Share replays to social media
   - Embed replays on websites
   - Collaborative playlists

---

## 📝 Notes

- Cloudflare Stream automatically handles HLS recording
- Leaderboards are calculated server-side for accuracy
- All times are in UTC
- Scores are stored as NUMERIC for precision
- Historical data is preserved for trend analysis

---

## 🐛 Troubleshooting

### Leaderboards Not Updating

1. Check if the Edge Function is running:
   ```bash
   # View Edge Function logs
   supabase functions logs calculate-leaderboards-daily
   ```

2. Manually trigger calculation:
   ```typescript
   await leaderboardSnapshotService.triggerCalculation();
   ```

3. Verify cron schedule is set up correctly

### Replays Not Saving

1. Verify Cloudflare Stream is configured correctly
2. Check that HLS recording is enabled in Cloudflare
3. Ensure `createReplay()` is called when stream ends
4. Check database permissions and RLS policies

---

## 📚 Related Documentation

- [Cloudflare Stream Documentation](https://developers.cloudflare.com/stream/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Cron Jobs](https://supabase.com/docs/guides/functions/schedule-functions)

---

**Implementation Complete! 🎉**

The Livestream Replay System and Leaderboards System are now fully implemented and ready to use.
