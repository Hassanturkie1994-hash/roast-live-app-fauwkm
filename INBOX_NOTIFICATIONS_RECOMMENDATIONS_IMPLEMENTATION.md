
# Inbox, Notifications, User Interactions & Recommendations Implementation

## Overview
This document describes the implementation of the Inbox & Notifications Center, User Interaction Engine, and Recommendation System for the Roast Live app.

## Features Implemented

### 1. Inbox & Notifications Center

#### Database Changes
- Updated `notifications` table to support new notification types:
  - Social: `like`, `comment`, `follow`
  - Gifts: `gift_received`
  - Safety: `warning`, `timeout_ended`, `ban_lifted`
  - Wallet & Earnings: `payout_completed`, `credit_purchase`, `subscription_failed`, `subscription_renewed`
  - Admin & System: `admin_announcement`, `system_update`
- Added `category` field to notifications table with categories: `social`, `gifts`, `safety`, `wallet`, `admin`
- Created indexes for performance optimization

#### UI Features
- **Category Filtering**: Users can filter notifications by category or view all
- **Unread Badges**: Each category shows unread count
- **Mark All as Read**: Users can mark all notifications (or category-specific) as read
- **Navigation**: Tapping a notification navigates to the relevant page (post, story, stream, profile)
- **Real-time Updates**: Notifications refresh every 10 seconds

#### Service Methods
```typescript
// notificationService.ts
- createNotification() - Create notification with auto-category detection
- getNotificationsByCategory() - Get notifications filtered by category
- getUnreadCount() - Get total unread count
- getUnreadCountByCategory() - Get unread count for specific category
- markAsRead() - Mark single notification as read
- markAllAsRead() - Mark all (or category-specific) as read
```

### 2. User Interaction Engine

#### Following System
- **Follow/Unfollow**: Users can follow/unfollow other users
- **Mutual Follow Detection**: Shows "Following back" if mutual
- **Notifications**: Sends inbox notification when followed
- **Service Methods**:
  ```typescript
  - followUser() - Follow a user with mutual detection
  - unfollowUser() - Unfollow a user
  - isFollowing() - Check if following
  - isMutualFollow() - Check if mutual follow
  - getFollowers() - Get user's followers
  - getFollowing() - Get users being followed
  ```

#### Likes System
- **Post Likes**: One like per user (toggle), counter increments instantly
- **Story Likes**: One like per user (toggle), counter increments instantly
- **Notifications**: Sends notification to content owner
- **Database Tables**:
  - `post_likes_v2` - Stores post likes with unique constraint
  - `story_likes_v2` - Stores story likes with unique constraint
- **Service Methods**:
  ```typescript
  - likePost() / unlikePost() - Like/unlike post
  - likeStory() / unlikeStory() - Like/unlike story
  - hasLikedPost() / hasLikedStory() - Check like status
  - getPostLikesCount() / getStoryLikesCount() - Get like counts
  ```

#### Comments System
- **Post Comments**: Users can comment on posts
- **Story Comments**: Users can comment on stories
- **Live Comments**: Users can comment during live streams
- **Comment Replies**: Users can reply to comments
- **Delete Own Comments**: Users can delete their own comments
- **Notifications**: Sends notification to content owner and parent comment author
- **Database Tables**:
  - `comment_replies` - Stores replies to post comments
  - `story_comment_replies` - Stores replies to story comments
- **Service Methods**:
  ```typescript
  - addPostComment() - Add comment to post
  - addStoryComment() - Add comment to story
  - addPostCommentReply() - Reply to post comment
  - addStoryCommentReply() - Reply to story comment
  - deletePostComment() - Delete post comment
  - deleteStoryComment() - Delete story comment
  ```

#### Moderation Features (Already Implemented)
- **Pin Comment**: Creators/moderators can pin comments for 1-5 minutes
- **Remove Comments**: Creators/moderators can remove comments
- **Timeout User**: Creators/moderators can timeout commenters
- **Ban User**: Creators/moderators can ban commenters
- **Action Menu**: Pressing usernames opens action menu with:
  - View profile
  - Follow
  - Add moderator
  - Timeout user
  - Ban user

### 3. Recommendation System

#### Database Tables
- **stream_ranking_metrics**: Stores real-time ranking metrics for live streams
  - `viewer_count` (weight 35%)
  - `avg_watch_duration_seconds` (weight 25%)
  - `gift_volume_last_10min` (weight 20%)
  - `comment_rate_per_minute` (weight 15%)
  - `follow_conversion_rate` (weight 5%)
  - `composite_score` - Calculated weighted score

- **creator_ranking_metrics**: Stores creator ranking metrics
  - `account_age_days`
  - `profile_completeness_percent`
  - `stream_frequency_per_week`
  - `total_streams`
  - `total_replay_views`
  - `discovery_boost_active` - 300% boost for new creators
  - `discovery_boost_expires_at` - Boost expires after 5 minutes
  - `composite_score`

- **replay_ranking_metrics**: Stores replay ranking metrics
  - `original_composite_score` - Original stream score
  - `replay_composite_score` - 50% weight reduction
  - `replay_views`

#### Ranking Algorithm
```typescript
// Composite score calculation (0-100 scale)
score = 
  (viewerCount / 1000) * 0.35 +
  (avgWatchDuration / 3600) * 0.25 +
  (giftVolumeLast10min / 10000) * 0.20 +
  (commentRatePerMinute / 100) * 0.15 +
  (followConversionRate) * 0.05

// Discovery boost for new creators (<2 streams)
if (newCreator && withinFirst5Minutes) {
  score *= 3; // 300% boost
}

// Replay score
replayScore = originalScore * 0.5; // 50% weight reduction
```

#### Edge Function Endpoints
- **`/recommend/live-now`**: Returns ranked live streams
- **`/recommend/replay`**: Returns ranked replays
- **`/recommend/users`**: Returns ranked creators

#### Explore Section Features
- **🔥 Trending Creators**: Top creators by followers and engagement
- **✨ Growing Fast**: New creators gaining followers quickly
- **🎁 Most Supported**: Creators with highest gift revenue
- **📈 Most Gifted Streams**: Live streams receiving most gifts
- **🔴 Live Now**: Ranked live streams with discovery boost

#### Service Methods
```typescript
// recommendationService.ts
- calculateStreamScore() - Calculate composite score
- updateStreamMetrics() - Update stream ranking metrics
- applyDiscoveryBoost() - Apply 300% boost for new creators
- getRecommendedLiveStreams() - Get ranked live streams
- getRecommendedReplays() - Get ranked replays
- getRecommendedUsers() - Get ranked creators
- getTrendingCreators() - Get trending creators
- getGrowingFastCreators() - Get fast-growing creators
- getMostSupportedCreators() - Get most supported creators
- getMostGiftedStreams() - Get most gifted streams
- createReplayMetrics() - Create replay metrics when stream ends
```

## Database Functions

### Like Increment/Decrement Functions
```sql
-- Increment/decrement post likes
increment_post_likes(post_id uuid)
decrement_post_likes(post_id uuid)

-- Increment/decrement story likes
increment_story_likes(story_id uuid)
decrement_story_likes(story_id uuid)
```

## Row Level Security (RLS)

All new tables have RLS enabled with appropriate policies:
- **Likes**: Users can view all, insert/delete their own
- **Comment Replies**: Users can view all, insert/delete their own
- **Ranking Metrics**: Read-only for users

## Usage Examples

### Following a User
```typescript
import { followService } from '@/app/services/followService';

const result = await followService.followUser(currentUserId, targetUserId);
if (result.success) {
  console.log('Mutual follow:', result.isMutual);
}
```

### Liking a Post
```typescript
import { likeService } from '@/app/services/likeService';

// Like
await likeService.likePost(userId, postId);

// Unlike
await likeService.unlikePost(userId, postId);

// Check if liked
const hasLiked = await likeService.hasLikedPost(userId, postId);
```

### Adding a Comment
```typescript
import { commentService } from '@/app/services/commentService';

// Comment on post
await commentService.addPostComment(postId, userId, 'Great post!');

// Reply to comment
await commentService.addPostCommentReply(parentCommentId, userId, 'Thanks!');
```

### Getting Recommendations
```typescript
import { recommendationService } from '@/app/services/recommendationService';

// Get recommended live streams
const liveStreams = await recommendationService.getRecommendedLiveStreams(20);

// Get trending creators
const trending = await recommendationService.getTrendingCreators(10);

// Update stream metrics
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: 150,
  avgWatchDuration: 1800,
  giftVolumeLast10min: 5000,
  commentRatePerMinute: 25,
  followConversionRate: 0.15,
});
```

### Creating Notifications
```typescript
import { notificationService } from '@/app/services/notificationService';

// Auto-categorized notification
await notificationService.createNotification(
  senderId,
  receiverId,
  'like',
  'liked your post',
  postId
);

// Manual category
await notificationService.createNotification(
  senderId,
  receiverId,
  'gift_received',
  'sent you a gift worth 100 SEK',
  undefined,
  undefined,
  streamId,
  'gifts'
);
```

## Integration Points

### When Starting a Live Stream
```typescript
// Apply discovery boost for new creators
await recommendationService.applyDiscoveryBoost(creatorId);

// Initialize stream metrics
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: 0,
  avgWatchDuration: 0,
  giftVolumeLast10min: 0,
  commentRatePerMinute: 0,
  followConversionRate: 0,
});
```

### When Stream Ends
```typescript
// Create replay metrics
await recommendationService.createReplayMetrics(streamId);
```

### When User Sends Gift
```typescript
// Update gift volume metric
await recommendationService.updateStreamMetrics(streamId, {
  giftVolumeLast10min: currentVolume + giftAmount,
});

// Send notification
await notificationService.createNotification(
  senderId,
  receiverId,
  'gift_received',
  `sent "${giftName}" worth ${amount}`,
  undefined,
  undefined,
  streamId,
  'gifts'
);
```

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns have indexes
2. **Caching**: Recommendation scores are cached in database tables
3. **Batch Updates**: Stream metrics should be updated in batches (every 10-20 seconds)
4. **Pagination**: All list endpoints support limit parameter
5. **Real-time**: Notifications refresh every 10 seconds (can be optimized with Supabase Realtime)

## Future Enhancements

1. **Real-time Notifications**: Use Supabase Realtime subscriptions
2. **Push Notifications**: Integrate with Expo Notifications
3. **Advanced Filtering**: Add date range, search, and advanced filters
4. **Analytics Dashboard**: Show notification engagement metrics
5. **Machine Learning**: Improve recommendation algorithm with ML
6. **A/B Testing**: Test different ranking weights
7. **Personalization**: Personalized recommendations based on user behavior

## Testing

### Test Scenarios
1. Follow/unfollow users and verify notifications
2. Like/unlike posts and stories
3. Add comments and replies
4. Filter notifications by category
5. Mark notifications as read
6. Verify discovery boost for new creators
7. Check ranking scores update correctly
8. Test Edge Function endpoints

### Database Verification
```sql
-- Check notification categories
SELECT category, COUNT(*) FROM notifications GROUP BY category;

-- Check like counts
SELECT COUNT(*) FROM post_likes_v2;
SELECT COUNT(*) FROM story_likes_v2;

-- Check ranking metrics
SELECT * FROM stream_ranking_metrics ORDER BY composite_score DESC LIMIT 10;
SELECT * FROM creator_ranking_metrics ORDER BY composite_score DESC LIMIT 10;
```

## Notes

- All actions persist in database
- All actions are reversible
- Live streaming API is NOT modified
- Cloudflare logic is NOT affected
- All features work on iOS and Android
- Dark/light theme support included
- Proper error handling and logging
- RLS policies ensure data security

## Files Modified/Created

### New Files
- `app/services/likeService.ts`
- `app/services/recommendationService.ts`
- `supabase/functions/recommend-live-now/index.ts`
- `supabase/functions/recommend-replay/index.ts`
- `supabase/functions/recommend-users/index.ts`

### Modified Files
- `app/(tabs)/inbox.tsx` - Complete redesign with categories
- `app/services/notificationService.ts` - Added category support
- `app/services/followService.ts` - Added notifications and mutual follow detection
- `app/services/commentService.ts` - Added replies and notifications
- `app/(tabs)/explore.tsx` - Integrated recommendation system

### Database Migrations
- `add_likes_and_recommendation_tables` - Created all new tables
- `add_like_increment_functions` - Created increment/decrement functions

## Conclusion

The implementation provides a complete notification system with categorization, a robust user interaction engine with likes/comments/follows, and an intelligent recommendation system that ranks content based on multiple weighted signals. All features are production-ready and follow best practices for security, performance, and user experience.
