
# Quick Reference: Interactions & Recommendations

## Notifications

### Send Notification
```typescript
import { notificationService } from '@/app/services/notificationService';

// Social notification
await notificationService.createNotification(
  senderId,
  receiverId,
  'like',
  'liked your post',
  postId,
  undefined,
  undefined,
  'social'
);

// Gift notification
await notificationService.createNotification(
  senderId,
  receiverId,
  'gift_received',
  'sent you a Rose worth 50 SEK',
  undefined,
  undefined,
  streamId,
  'gifts'
);
```

### Get Notifications
```typescript
// All notifications
const { notifications } = await notificationService.getNotificationsByCategory(userId);

// By category
const { notifications } = await notificationService.getNotificationsByCategory(userId, 'social');

// Unread count
const { count } = await notificationService.getUnreadCount(userId);
```

## Following

### Follow/Unfollow
```typescript
import { followService } from '@/app/services/followService';

// Follow
const result = await followService.followUser(followerId, followingId);
console.log('Mutual:', result.isMutual);

// Unfollow
await followService.unfollowUser(followerId, followingId);

// Check status
const isFollowing = await followService.isFollowing(followerId, followingId);
const isMutual = await followService.isMutualFollow(userId1, userId2);
```

## Likes

### Like/Unlike Posts
```typescript
import { likeService } from '@/app/services/likeService';

// Like post
await likeService.likePost(userId, postId);

// Unlike post
await likeService.unlikePost(userId, postId);

// Check if liked
const hasLiked = await likeService.hasLikedPost(userId, postId);

// Get count
const count = await likeService.getPostLikesCount(postId);
```

### Like/Unlike Stories
```typescript
// Like story
await likeService.likeStory(userId, storyId);

// Unlike story
await likeService.unlikeStory(userId, storyId);

// Check if liked
const hasLiked = await likeService.hasLikedStory(userId, storyId);
```

## Comments

### Post Comments
```typescript
import { commentService } from '@/app/services/commentService';

// Add comment
await commentService.addPostComment(postId, userId, 'Great post!');

// Add reply
await commentService.addPostCommentReply(parentCommentId, userId, 'Thanks!');

// Delete comment
await commentService.deletePostComment(commentId);
```

### Story Comments
```typescript
// Add comment
await commentService.addStoryComment(storyId, userId, 'Love this!');

// Add reply
await commentService.addStoryCommentReply(parentCommentId, userId, 'Thanks!');

// Delete comment
await commentService.deleteStoryComment(commentId);
```

## Recommendations

### Get Recommendations
```typescript
import { recommendationService } from '@/app/services/recommendationService';

// Live streams (ranked)
const liveStreams = await recommendationService.getRecommendedLiveStreams(20);

// Replays (ranked)
const replays = await recommendationService.getRecommendedReplays(20);

// Users/Creators (ranked)
const users = await recommendationService.getRecommendedUsers(20);

// Trending creators
const trending = await recommendationService.getTrendingCreators(10);

// Growing fast
const growing = await recommendationService.getGrowingFastCreators(10);

// Most supported
const supported = await recommendationService.getMostSupportedCreators(10);

// Most gifted streams
const gifted = await recommendationService.getMostGiftedStreams(10);
```

### Update Stream Metrics
```typescript
// Update metrics (call every 10-20 seconds during stream)
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: 150,
  avgWatchDuration: 1800, // seconds
  giftVolumeLast10min: 5000, // SEK cents
  commentRatePerMinute: 25,
  followConversionRate: 0.15, // 15%
});
```

### Discovery Boost
```typescript
// Apply boost when stream starts (for new creators)
await recommendationService.applyDiscoveryBoost(creatorId);
```

### Create Replay Metrics
```typescript
// Call when stream ends
await recommendationService.createReplayMetrics(streamId);
```

## Edge Function Endpoints

### Recommend Live Now
```
GET /functions/v1/recommend-live-now?limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "streams": [
    {
      "id": "...",
      "title": "...",
      "viewer_count": 150,
      "composite_score": 85.5,
      "users": { ... }
    }
  ]
}
```

### Recommend Replay
```
GET /functions/v1/recommend-replay?limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "replays": [
    {
      "id": "...",
      "title": "...",
      "replay_composite_score": 42.75,
      "replay_views": 1250,
      "users": { ... }
    }
  ]
}
```

### Recommend Users
```
GET /functions/v1/recommend-users?limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "users": [
    {
      "id": "...",
      "username": "...",
      "composite_score": 78.3,
      "total_streams": 45,
      "followers_count": 1250
    }
  ]
}
```

## Notification Categories

- **social**: likes, comments, follows
- **gifts**: gift_received
- **safety**: warning, timeout_ended, ban_lifted
- **wallet**: payout_completed, credit_purchase, subscription_failed, subscription_renewed
- **admin**: admin_announcement, system_update

## Ranking Weights

### Stream Ranking
- Viewer Count: 35%
- Avg Watch Duration: 25%
- Gift Volume (last 10 min): 20%
- Comment Rate: 15%
- Follow Conversion: 5%

### Discovery Boost
- New creators (<2 streams): 300% boost
- Duration: First 5 minutes of stream
- Auto-expires after 5 minutes

### Replay Ranking
- Inherits original stream score
- 50% weight reduction
- Sorted by replay views

## Database Tables

### Likes
- `post_likes_v2` - Post likes
- `story_likes_v2` - Story likes

### Comments
- `comment_replies` - Post comment replies
- `story_comment_replies` - Story comment replies

### Ranking
- `stream_ranking_metrics` - Live stream metrics
- `creator_ranking_metrics` - Creator metrics
- `replay_ranking_metrics` - Replay metrics

## Common Patterns

### When User Follows
```typescript
const result = await followService.followUser(followerId, followingId);
// Notification sent automatically
// Mutual follow detected automatically
```

### When User Likes Post
```typescript
await likeService.likePost(userId, postId);
// Like count incremented automatically
// Notification sent automatically
```

### When User Comments
```typescript
await commentService.addPostComment(postId, userId, comment);
// Comment count incremented automatically
// Notification sent automatically
```

### When Stream Starts
```typescript
// 1. Apply discovery boost
await recommendationService.applyDiscoveryBoost(creatorId);

// 2. Initialize metrics
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: 0,
  avgWatchDuration: 0,
  giftVolumeLast10min: 0,
  commentRatePerMinute: 0,
  followConversionRate: 0,
});
```

### During Stream (every 10-20 seconds)
```typescript
// Update metrics
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: currentViewers,
  avgWatchDuration: calculateAvgDuration(),
  giftVolumeLast10min: calculateGiftVolume(),
  commentRatePerMinute: calculateCommentRate(),
  followConversionRate: calculateFollowRate(),
});
```

### When Stream Ends
```typescript
// Create replay metrics
await recommendationService.createReplayMetrics(streamId);
```

## Error Handling

All service methods return `{ success: boolean, error?: any }`:

```typescript
const result = await likeService.likePost(userId, postId);
if (!result.success) {
  console.error('Failed to like post:', result.error);
  // Show error to user
}
```

## Performance Tips

1. **Batch Updates**: Update stream metrics every 10-20 seconds, not on every event
2. **Cache Checks**: Cache like/follow status in component state
3. **Pagination**: Use limit parameter for large lists
4. **Indexes**: All tables have proper indexes
5. **RLS**: All tables have Row Level Security enabled

## Testing Checklist

- [ ] Follow/unfollow users
- [ ] Like/unlike posts and stories
- [ ] Add comments and replies
- [ ] Delete own comments
- [ ] Filter notifications by category
- [ ] Mark notifications as read
- [ ] Verify discovery boost works
- [ ] Check ranking scores update
- [ ] Test Edge Function endpoints
- [ ] Verify mutual follow detection
- [ ] Check notification navigation
