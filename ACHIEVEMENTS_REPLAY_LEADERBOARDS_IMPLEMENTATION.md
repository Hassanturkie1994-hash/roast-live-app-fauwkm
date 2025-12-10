
# Achievements, Replay & Leaderboards Implementation Summary

## Overview
This document outlines the complete implementation of three major systems for Roast Live:
1. **Achievements System** - Badge system with user progress tracking
2. **Replay System** - Save and view livestream replays with comments and analytics
3. **Global Leaderboards** - Weekly rankings for creators, fans, and trending content

---

## 1. Achievements System

### Database Tables Created

#### `achievements`
Stores all available achievements in the system.
- `id` (uuid, primary key)
- `achievement_key` (text, unique) - Unique identifier for each achievement
- `name` (text) - Display name
- `description` (text) - Achievement description
- `emoji` (text) - Emoji icon
- `category` (text) - 'beginner', 'engagement', 'support', or 'creator'
- `requirement_value` (integer) - Threshold to unlock
- `created_at` (timestamptz)

#### `user_achievements`
Tracks which achievements users have unlocked.
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to profiles)
- `achievement_key` (text)
- `unlocked_at` (timestamptz)
- `created_at` (timestamptz)
- Unique constraint on (user_id, achievement_key)

#### `user_selected_badges`
Stores the 3 badges a user chooses to display publicly.
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to profiles, unique)
- `badge_1`, `badge_2`, `badge_3` (text, nullable)
- `updated_at` (timestamptz)
- `created_at` (timestamptz)

### Predefined Achievements

**Beginner:**
- 🏁 First View - Watched your first livestream
- 💬 First Comment - Posted your first comment
- ❤️ First Like - Liked your first content
- 🎁 First Gift Sent - Sent your first gift
- 👤 First Follow - Followed your first creator

**Engagement:**
- ⏱ 10 Hours Watched - Watched 10 hours of content
- 🔥 50 Hours Watched - Watched 50 hours of content
- 💎 100 Hours Watched - Watched 100 hours of content

**Support:**
- 💸 100 kr Spent - Spent 100 kr supporting creators
- 💸 500 kr Spent - Spent 500 kr supporting creators
- 💸 2000 kr Spent - Spent 2000 kr supporting creators
- 💸 5000 kr Spent - Spent 5000 kr supporting creators

**Creator:**
- 📺 First Live Stream - Completed your first livestream
- 👑 10 Live Streams - Completed 10 livestreams
- ⭐ 100 Live Streams - Completed 100 livestreams

### Service: `achievementService.ts`

**Key Methods:**
- `getAllAchievements()` - Get all available achievements
- `getUserAchievements(userId)` - Get user's unlocked achievements
- `hasAchievement(userId, achievementKey)` - Check if user has specific achievement
- `unlockAchievement(userId, achievementKey)` - Unlock achievement and send notification
- `getSelectedBadges(userId)` - Get user's 3 selected display badges
- `updateSelectedBadges(userId, badge1, badge2, badge3)` - Update display badges
- `checkAndUnlockAchievements(userId, activityType)` - Auto-check and unlock based on activity

**Activity Types:**
- `view` - First view achievement
- `comment` - First comment achievement
- `like` - First like achievement
- `gift_sent` - First gift + spending achievements
- `follow` - First follow achievement
- `watch_time` - Watch time achievements (10h, 50h, 100h)
- `spending` - Spending achievements (100kr, 500kr, 2000kr, 5000kr)
- `stream_completed` - Creator achievements (1, 10, 100 streams)

### Components

**`AchievementBadge.tsx`**
- Displays individual achievement badge
- Supports 3 sizes: small, medium, large
- Shows locked state for unearned achievements
- Optional onPress handler

**`AchievementsScreen.tsx`**
- Full achievements management screen
- Display badges section (select 3 to show publicly)
- Progress tracker
- Grouped achievements by category
- Edit mode for selecting display badges

### Integration Points

**When to trigger achievement checks:**

```typescript
// After user views a stream
await achievementService.checkAndUnlockAchievements(userId, 'view');

// After user comments
await achievementService.checkAndUnlockAchievements(userId, 'comment');

// After user likes content
await achievementService.checkAndUnlockAchievements(userId, 'like');

// After user sends a gift
await achievementService.checkAndUnlockAchievements(userId, 'gift_sent');

// After user follows someone
await achievementService.checkAndUnlockAchievements(userId, 'follow');

// After stream ends (for creator)
await achievementService.checkAndUnlockAchievements(creatorId, 'stream_completed');

// Periodically check watch time and spending
await achievementService.checkAndUnlockAchievements(userId, 'watch_time');
await achievementService.checkAndUnlockAchievements(userId, 'spending');
```

**Display badges in chat:**
```typescript
const badges = await achievementService.getSelectedBadges(userId);
// Show badges[0], badges[1], badges[2] next to username in chat
```

---

## 2. Replay System

### Database Tables Created

#### `stream_replays`
Main replay records.
- `id` (uuid, primary key)
- `stream_id` (uuid, foreign key to streams, unique)
- `creator_id` (uuid, foreign key to profiles)
- `replay_url` (text) - Cloudflare video URL
- `thumbnail_url` (text, nullable)
- `total_duration_seconds` (integer)
- `started_at` (timestamptz)
- `ended_at` (timestamptz)
- `title` (text)
- `views_count` (integer, default 0)
- `likes_count` (integer, default 0)
- `comments_count` (integer, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `replay_views`
Track individual replay views.
- `id` (uuid, primary key)
- `replay_id` (uuid, foreign key to stream_replays)
- `user_id` (uuid, foreign key to profiles, nullable)
- `watched_duration_seconds` (integer)
- `watch_percentage` (numeric)
- `created_at` (timestamptz)

#### `replay_comments`
Comments on replays (supports threading).
- `id` (uuid, primary key)
- `replay_id` (uuid, foreign key to stream_replays)
- `user_id` (uuid, foreign key to profiles)
- `comment` (text)
- `parent_comment_id` (uuid, foreign key to replay_comments, nullable)
- `likes_count` (integer, default 0)
- `created_at` (timestamptz)

#### `replay_likes`
Track replay likes.
- `id` (uuid, primary key)
- `replay_id` (uuid, foreign key to stream_replays)
- `user_id` (uuid, foreign key to profiles)
- `created_at` (timestamptz)
- Unique constraint on (replay_id, user_id)

#### `replay_comment_likes`
Track comment likes.
- `id` (uuid, primary key)
- `comment_id` (uuid, foreign key to replay_comments)
- `user_id` (uuid, foreign key to profiles)
- `created_at` (timestamptz)
- Unique constraint on (comment_id, user_id)

#### `replay_analytics`
Analytics data for replays.
- `id` (uuid, primary key)
- `replay_id` (uuid, foreign key to stream_replays, unique)
- `total_views` (integer)
- `avg_watch_percentage` (numeric)
- `new_followers_gained` (integer)
- `peak_concurrent_viewers` (integer)
- `most_watched_timestamp` (integer, nullable) - seconds into replay
- `updated_at` (timestamptz)
- `created_at` (timestamptz)

### Service: `replayService.ts`

**Key Methods:**
- `createReplay(streamId, creatorId, replayUrl, title, startedAt, endedAt, thumbnailUrl?)` - Create replay
- `getReplay(replayId)` - Get replay by ID
- `getCreatorReplays(creatorId)` - Get all replays for a creator
- `deleteReplay(replayId, creatorId)` - Delete a replay
- `trackView(replayId, userId, watchedDurationSeconds, totalDurationSeconds)` - Track view
- `getComments(replayId)` - Get comments with replies
- `addComment(replayId, userId, comment, parentCommentId?)` - Add comment or reply
- `likeReplay(replayId, userId)` - Like a replay
- `unlikeReplay(replayId, userId)` - Unlike a replay
- `getAnalytics(replayId)` - Get replay analytics

### Components

**`SaveReplayModal.tsx`**
- Modal shown after livestream ends
- "Save Replay" or "Delete Replay" options
- Loading state during save/delete

**`ReplayPlayerScreen.tsx`**
- Full replay player with video controls
- Replay info (title, views, duration, date)
- Like, comment, share actions
- Comments section with threading
- Tracks watch time for analytics

### Integration Points

**After livestream ends:**
```typescript
import { SaveReplayModal } from '@/components/SaveReplayModal';

// Show modal
<SaveReplayModal
  visible={showModal}
  onSave={async () => {
    await replayService.createReplay(
      streamId,
      creatorId,
      cloudflareReplayUrl,
      streamTitle,
      startedAt,
      endedAt,
      thumbnailUrl
    );
  }}
  onDelete={async () => {
    // Just close, don't save
  }}
  onClose={() => setShowModal(false)}
/>
```

**Display replays on profile:**
```typescript
const replays = await replayService.getCreatorReplays(creatorId);
// Show in a "REPLAYS" tab on profile
```

**Navigate to replay player:**
```typescript
router.push(`/replay-player?replayId=${replay.id}`);
```

---

## 3. Global Leaderboards System

### Database Tables Created

#### `global_leaderboard_creators`
Weekly top creators leaderboard.
- `id` (uuid, primary key)
- `creator_id` (uuid, foreign key to profiles)
- `week_start_date` (date)
- `total_watch_hours` (numeric)
- `total_gifts_received_sek` (integer)
- `followers_gained` (integer)
- `total_streams` (integer)
- `composite_score` (numeric)
- `rank` (integer)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Unique constraint on (creator_id, week_start_date)

#### `global_leaderboard_fans`
Weekly top fans leaderboard.
- `id` (uuid, primary key)
- `fan_id` (uuid, foreign key to profiles)
- `week_start_date` (date)
- `total_gift_spending_sek` (integer)
- `total_watch_time_seconds` (integer)
- `comment_activity_count` (integer)
- `is_vip_member` (boolean)
- `composite_score` (numeric)
- `rank` (integer)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Unique constraint on (fan_id, week_start_date)

#### `trending_creators`
Weekly trending creators leaderboard.
- `id` (uuid, primary key)
- `creator_id` (uuid, foreign key to profiles)
- `week_start_date` (date)
- `follower_growth_percentage` (numeric)
- `viewer_peak_delta` (integer)
- `retention_growth_percentage` (numeric)
- `composite_score` (numeric)
- `rank` (integer)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- Unique constraint on (creator_id, week_start_date)

#### `leaderboard_history`
Historical leaderboard data.
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to profiles)
- `leaderboard_type` (text) - 'top_creators', 'top_fans', or 'trending_creators'
- `week_start_date` (date)
- `rank` (integer)
- `composite_score` (numeric)
- `metadata` (jsonb) - Additional stats
- `created_at` (timestamptz)

### Service: `globalLeaderboardService.ts`

**Key Methods:**
- `getTopCreators(limit)` - Get current week's top creators
- `getTopFans(limit)` - Get current week's top fans
- `getTrendingCreators(limit)` - Get current week's trending creators
- `getUserRank(userId, leaderboardType)` - Get user's current rank
- `getUserHistory(userId, leaderboardType, limit)` - Get user's historical rankings
- `calculateLeaderboards()` - Calculate all leaderboards (run weekly)

**Composite Score Formulas:**

**Top Creators:**
```
score = (total_watch_hours * 10) + 
        (total_gifts_received_sek * 0.5) + 
        (followers_gained * 5) + 
        (total_streams * 20)
```

**Top Fans:**
```
score = (total_gift_spending_sek * 1.0) + 
        ((total_watch_time_seconds / 3600) * 5) + 
        (comment_activity_count * 2) + 
        (is_vip_member ? 100 : 0)
```

**Trending Creators:**
```
score = follower_growth_percentage
```

### Components

**`GlobalLeaderboardTabs.tsx`**
- Tabbed interface for 3 leaderboard types
- Shows top 50 entries per leaderboard
- Displays rank, avatar, username, and key stat
- Gold/Silver/Bronze medals for top 3
- Auto-refreshes on mount

### Integration Points

**Display in Explore screen:**
```typescript
import { GlobalLeaderboardTabs } from '@/components/GlobalLeaderboardTabs';

// Add to top of Explore screen
<GlobalLeaderboardTabs />
```

**Display on creator profile:**
```typescript
const rank = await globalLeaderboardService.getUserRank(creatorId, 'top_creators');
// Show rank badge on profile
```

**Display in stream dashboard:**
```typescript
const rank = await globalLeaderboardService.getUserRank(creatorId, 'top_creators');
const history = await globalLeaderboardService.getUserHistory(creatorId, 'top_creators', 5);
// Show current rank and trend
```

**Weekly calculation (run via cron or edge function):**
```typescript
// Every Sunday at midnight
await globalLeaderboardService.calculateLeaderboards();
```

---

## RLS Policies

All tables have appropriate Row Level Security policies:
- Public read access for all leaderboards, achievements, and replays
- Users can only modify their own data
- System/service role can insert/update leaderboard data

---

## Notifications

### Achievement Unlocked
When a user unlocks an achievement:
- Push notification sent
- Inbox notification created
- Shows achievement emoji, name, and description

### Replay Saved
When a creator saves a replay:
- Followers can be notified (optional)
- Replay appears in creator's profile

---

## Analytics & Tracking

### Achievement Progress
- Track user activity to auto-unlock achievements
- Monitor achievement unlock rates
- Popular vs rare achievements

### Replay Performance
- View count and watch percentage
- Most watched parts of replay
- New followers gained from replay
- Comment and like engagement

### Leaderboard Engagement
- Track how many users check leaderboards
- Monitor rank changes week-over-week
- Identify top performers

---

## Future Enhancements

### Achievements
- Seasonal/limited-time achievements
- Achievement tiers (bronze, silver, gold)
- Achievement rewards (coins, special badges)
- Social sharing of achievements

### Replays
- Clip creation from replays
- Timestamp comments
- Replay playlists
- Download replays (for creators)

### Leaderboards
- Monthly/yearly leaderboards
- Category-specific leaderboards
- Regional leaderboards
- Leaderboard rewards

---

## Testing Checklist

### Achievements
- [ ] Unlock each achievement type
- [ ] Select 3 display badges
- [ ] Verify badges show in chat
- [ ] Test achievement notifications
- [ ] Verify locked achievements display correctly

### Replays
- [ ] Save replay after stream ends
- [ ] Delete replay option works
- [ ] Play replay with video controls
- [ ] Add comments and replies
- [ ] Like/unlike replay
- [ ] Track view duration
- [ ] Verify analytics update

### Leaderboards
- [ ] View all 3 leaderboard types
- [ ] Verify rankings are correct
- [ ] Check user rank display
- [ ] Test leaderboard history
- [ ] Run weekly calculation
- [ ] Verify data persists to history

---

## API Endpoints Summary

### Achievements
- GET `/achievements` - All achievements
- GET `/user-achievements/:userId` - User's achievements
- POST `/unlock-achievement` - Unlock achievement
- GET `/selected-badges/:userId` - User's display badges
- PUT `/selected-badges/:userId` - Update display badges

### Replays
- POST `/replays` - Create replay
- GET `/replays/:replayId` - Get replay
- GET `/replays/creator/:creatorId` - Creator's replays
- DELETE `/replays/:replayId` - Delete replay
- POST `/replays/:replayId/view` - Track view
- GET `/replays/:replayId/comments` - Get comments
- POST `/replays/:replayId/comments` - Add comment
- POST `/replays/:replayId/like` - Like replay
- DELETE `/replays/:replayId/like` - Unlike replay
- GET `/replays/:replayId/analytics` - Get analytics

### Leaderboards
- GET `/leaderboards/creators` - Top creators
- GET `/leaderboards/fans` - Top fans
- GET `/leaderboards/trending` - Trending creators
- GET `/leaderboards/:type/rank/:userId` - User rank
- GET `/leaderboards/:type/history/:userId` - User history
- POST `/leaderboards/calculate` - Calculate leaderboards (admin)

---

## Important Notes

1. **No Livestream API Changes**: All systems are completely separate from livestream start/stop logic
2. **Cloudflare Integration**: Replay URLs come from Cloudflare Stream
3. **Weekly Reset**: Leaderboards reset every Sunday at midnight
4. **Push Notifications**: Achievement unlocks trigger push notifications
5. **RLS Enabled**: All tables have Row Level Security enabled
6. **Indexes**: Proper indexes created for performance
7. **Composite Scores**: Weighted formulas for fair ranking

---

## Support & Maintenance

### Database Maintenance
- Monitor table sizes
- Optimize indexes as needed
- Archive old leaderboard history

### Performance Monitoring
- Track query performance
- Monitor API response times
- Optimize slow queries

### User Feedback
- Collect feedback on achievement difficulty
- Monitor replay engagement
- Adjust leaderboard formulas if needed

---

## Conclusion

All three systems are now fully implemented and ready for use:
- ✅ Achievements system with 15 predefined achievements
- ✅ Replay system with comments, likes, and analytics
- ✅ Global leaderboards with 3 categories and weekly resets

The systems are designed to be independent, scalable, and easy to maintain. They enhance user engagement without affecting core livestreaming functionality.
