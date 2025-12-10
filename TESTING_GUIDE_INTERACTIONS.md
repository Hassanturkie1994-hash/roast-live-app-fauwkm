
# Testing Guide: Interactions & Recommendations

## Quick Test Checklist

### 1. Inbox & Notifications ✅

#### Test Category Filtering
- [ ] Open Inbox screen
- [ ] Verify "All" shows all notifications
- [ ] Tap each category chip (Social, Gifts, Safety, Wallet, Admin)
- [ ] Verify notifications filter correctly
- [ ] Check unread badges show correct counts

#### Test Mark as Read
- [ ] Tap "Mark All Read" button
- [ ] Verify all notifications marked as read
- [ ] Verify unread badges disappear
- [ ] Filter by category and mark category as read
- [ ] Verify only that category marked as read

#### Test Navigation
- [ ] Tap notification with post reference → Should open post
- [ ] Tap notification with story reference → Should open story
- [ ] Tap notification with stream reference → Should open stream
- [ ] Tap notification with sender → Should open profile

#### Test Real-time Updates
- [ ] Keep inbox open
- [ ] Have another user follow you
- [ ] Verify notification appears within 10 seconds
- [ ] Pull to refresh manually
- [ ] Verify notifications update

### 2. Following System ✅

#### Test Follow/Unfollow
```typescript
// Test in console or create test screen
import { followService } from '@/app/services/followService';

// Follow user
const result = await followService.followUser(myUserId, targetUserId);
console.log('Success:', result.success);
console.log('Is Mutual:', result.isMutual);

// Check if following
const isFollowing = await followService.isFollowing(myUserId, targetUserId);
console.log('Is Following:', isFollowing);

// Unfollow
await followService.unfollowUser(myUserId, targetUserId);
```

#### Test Mutual Follow
- [ ] User A follows User B
- [ ] Verify User B receives notification
- [ ] User B follows User A back
- [ ] Verify User A receives "is now following you back" notification
- [ ] Check `isMutualFollow()` returns true

#### Test Notification
- [ ] Follow a user
- [ ] Check their inbox for notification
- [ ] Verify notification is in "Social" category
- [ ] Tap notification → Should open your profile

### 3. Likes System ✅

#### Test Post Likes
```typescript
import { likeService } from '@/app/services/likeService';

// Like post
await likeService.likePost(userId, postId);

// Check if liked
const hasLiked = await likeService.hasLikedPost(userId, postId);
console.log('Has Liked:', hasLiked);

// Get count
const count = await likeService.getPostLikesCount(postId);
console.log('Like Count:', count);

// Unlike
await likeService.unlikePost(userId, postId);
```

#### Test Story Likes
- [ ] Like a story
- [ ] Verify like count increments
- [ ] Verify heart icon changes color
- [ ] Unlike story
- [ ] Verify like count decrements
- [ ] Verify heart icon changes back

#### Test Like Notifications
- [ ] Like someone's post
- [ ] Check their inbox for notification
- [ ] Verify notification is in "Social" category
- [ ] Tap notification → Should open the post

#### Test Toggle Behavior
- [ ] Like a post
- [ ] Try to like again → Should unlike
- [ ] Verify count decrements
- [ ] Like again → Should like
- [ ] Verify count increments

### 4. Comments System ✅

#### Test Post Comments
```typescript
import { commentService } from '@/app/services/commentService';

// Add comment
const result = await commentService.addPostComment(
  postId,
  userId,
  'Great post!'
);
console.log('Success:', result.success);

// Add reply
await commentService.addPostCommentReply(
  parentCommentId,
  userId,
  'Thanks!'
);

// Delete comment
await commentService.deletePostComment(commentId);
```

#### Test Story Comments
- [ ] Add comment to story
- [ ] Verify comment appears
- [ ] Add reply to comment
- [ ] Verify reply appears nested
- [ ] Delete own comment
- [ ] Verify comment removed

#### Test Comment Notifications
- [ ] Comment on someone's post
- [ ] Check their inbox for notification
- [ ] Reply to someone's comment
- [ ] Check their inbox for notification
- [ ] Verify notifications in "Social" category

#### Test Comment Restrictions
- [ ] Try to delete someone else's comment → Should fail
- [ ] Try to delete own comment → Should succeed
- [ ] Verify RLS policies work correctly

### 5. Recommendation System ✅

#### Test Live Stream Ranking
```typescript
import { recommendationService } from '@/app/services/recommendationService';

// Get recommended streams
const streams = await recommendationService.getRecommendedLiveStreams(10);
console.log('Streams:', streams);

// Check scores
streams.forEach(stream => {
  console.log(`${stream.title}: ${stream.composite_score}`);
});
```

#### Test Discovery Boost
- [ ] Create new account (0 streams)
- [ ] Start first livestream
- [ ] Verify discovery boost applied
- [ ] Check stream appears at top of recommendations
- [ ] Wait 5 minutes
- [ ] Verify boost expires

#### Test Metric Updates
```typescript
// Update stream metrics
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: 150,
  avgWatchDuration: 1800,
  giftVolumeLast10min: 5000,
  commentRatePerMinute: 25,
  followConversionRate: 0.15,
});

// Get updated score
const { data } = await supabase
  .from('stream_ranking_metrics')
  .select('composite_score')
  .eq('stream_id', streamId)
  .single();

console.log('New Score:', data.composite_score);
```

#### Test Explore Sections
- [ ] Open Explore screen
- [ ] Verify "Live Now" section shows ranked streams
- [ ] Verify "Trending Creators" section shows creators
- [ ] Verify "Growing Fast" section shows new creators
- [ ] Verify "Most Supported" section shows creators
- [ ] Verify "Most Gifted Streams" section shows streams
- [ ] Pull to refresh
- [ ] Verify all sections update

#### Test Replay Ranking
- [ ] End a livestream
- [ ] Verify replay metrics created
- [ ] Check replay score is 50% of original
- [ ] Get recommended replays
- [ ] Verify replay appears in results

### 6. Edge Function Endpoints ✅

#### Test /recommend/live-now
```bash
curl -X GET \
  'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/recommend-live-now?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Expected Response:
```json
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

#### Test /recommend/replay
```bash
curl -X GET \
  'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/recommend-replay?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

#### Test /recommend/users
```bash
curl -X GET \
  'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/recommend-users?limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 7. Database Verification ✅

#### Check Notification Categories
```sql
-- Count by category
SELECT category, COUNT(*) as count
FROM notifications
GROUP BY category
ORDER BY count DESC;

-- Check unread by category
SELECT category, COUNT(*) as unread_count
FROM notifications
WHERE read = false
GROUP BY category;
```

#### Check Likes
```sql
-- Post likes count
SELECT COUNT(*) FROM post_likes_v2;

-- Story likes count
SELECT COUNT(*) FROM story_likes_v2;

-- Top liked posts
SELECT p.id, p.caption, COUNT(pl.id) as likes
FROM posts p
LEFT JOIN post_likes_v2 pl ON p.id = pl.post_id
GROUP BY p.id
ORDER BY likes DESC
LIMIT 10;
```

#### Check Ranking Metrics
```sql
-- Top ranked streams
SELECT s.title, srm.composite_score, srm.viewer_count
FROM streams s
JOIN stream_ranking_metrics srm ON s.id = srm.stream_id
WHERE s.status = 'live'
ORDER BY srm.composite_score DESC
LIMIT 10;

-- Creators with discovery boost
SELECT p.username, crm.discovery_boost_active, crm.discovery_boost_expires_at
FROM profiles p
JOIN creator_ranking_metrics crm ON p.id = crm.creator_id
WHERE crm.discovery_boost_active = true;
```

#### Check Comment Replies
```sql
-- Post comment replies
SELECT COUNT(*) FROM comment_replies;

-- Story comment replies
SELECT COUNT(*) FROM story_comment_replies;

-- Comments with most replies
SELECT pc.comment, COUNT(cr.id) as reply_count
FROM post_comments pc
LEFT JOIN comment_replies cr ON pc.id = cr.parent_comment_id
GROUP BY pc.id
ORDER BY reply_count DESC
LIMIT 10;
```

### 8. Performance Testing ✅

#### Test Notification Load Time
```typescript
console.time('Load Notifications');
const { notifications } = await notificationService.getNotificationsByCategory(userId);
console.timeEnd('Load Notifications');
// Should be < 500ms
```

#### Test Recommendation Load Time
```typescript
console.time('Load Recommendations');
const streams = await recommendationService.getRecommendedLiveStreams(20);
console.timeEnd('Load Recommendations');
// Should be < 1000ms
```

#### Test Like Toggle Speed
```typescript
console.time('Like Post');
await likeService.likePost(userId, postId);
console.timeEnd('Like Post');
// Should be < 300ms
```

### 9. Error Handling ✅

#### Test Invalid IDs
```typescript
// Should handle gracefully
await likeService.likePost(userId, 'invalid-uuid');
await followService.followUser(userId, 'invalid-uuid');
await commentService.addPostComment('invalid-uuid', userId, 'test');
```

#### Test Duplicate Actions
```typescript
// Like twice (should toggle)
await likeService.likePost(userId, postId);
await likeService.likePost(userId, postId); // Should unlike

// Follow twice (should fail gracefully)
await followService.followUser(userId, targetId);
await followService.followUser(userId, targetId); // Should handle
```

#### Test Unauthorized Actions
```typescript
// Try to delete someone else's comment
await commentService.deletePostComment(otherUserCommentId);
// Should fail due to RLS
```

### 10. Integration Testing ✅

#### Test Complete Flow: Follow → Like → Comment
```typescript
// 1. Follow user
await followService.followUser(myUserId, targetUserId);

// 2. Like their post
await likeService.likePost(myUserId, theirPostId);

// 3. Comment on their post
await commentService.addPostComment(theirPostId, myUserId, 'Great!');

// 4. Check their notifications
const { notifications } = await notificationService.getNotificationsByCategory(
  targetUserId,
  'social'
);

// Should have 3 notifications
console.log('Notification Count:', notifications.length);
```

#### Test Complete Flow: Stream Start → Metrics → End
```typescript
// 1. Start stream
const streamId = 'new-stream-id';
await recommendationService.applyDiscoveryBoost(creatorId);

// 2. Update metrics during stream
await recommendationService.updateStreamMetrics(streamId, {
  viewerCount: 100,
  avgWatchDuration: 1200,
  giftVolumeLast10min: 3000,
  commentRatePerMinute: 20,
  followConversionRate: 0.10,
});

// 3. End stream
await recommendationService.createReplayMetrics(streamId);

// 4. Verify replay created
const replays = await recommendationService.getRecommendedReplays(10);
const myReplay = replays.find(r => r.id === streamId);
console.log('Replay Score:', myReplay?.replay_composite_score);
```

## Automated Test Script

Create a test file `test-interactions.ts`:

```typescript
import { followService } from '@/app/services/followService';
import { likeService } from '@/app/services/likeService';
import { commentService } from '@/app/services/commentService';
import { notificationService } from '@/app/services/notificationService';
import { recommendationService } from '@/app/services/recommendationService';

async function runTests() {
  console.log('🧪 Starting Tests...\n');

  // Test 1: Follow
  console.log('Test 1: Follow User');
  const followResult = await followService.followUser('user1', 'user2');
  console.log('✅ Follow:', followResult.success);

  // Test 2: Like
  console.log('\nTest 2: Like Post');
  const likeResult = await likeService.likePost('user1', 'post1');
  console.log('✅ Like:', likeResult.success);

  // Test 3: Comment
  console.log('\nTest 3: Add Comment');
  const commentResult = await commentService.addPostComment('post1', 'user1', 'Test comment');
  console.log('✅ Comment:', commentResult.success);

  // Test 4: Notifications
  console.log('\nTest 4: Get Notifications');
  const notifResult = await notificationService.getNotificationsByCategory('user2');
  console.log('✅ Notifications:', notifResult.notifications?.length);

  // Test 5: Recommendations
  console.log('\nTest 5: Get Recommendations');
  const streams = await recommendationService.getRecommendedLiveStreams(5);
  console.log('✅ Streams:', streams.length);

  console.log('\n🎉 All Tests Complete!');
}

runTests();
```

## Common Issues & Solutions

### Issue: Notifications not appearing
**Solution**: Check notification service is creating with correct category

### Issue: Likes not incrementing
**Solution**: Verify database functions are created and RLS policies allow

### Issue: Discovery boost not working
**Solution**: Check creator has <2 streams and boost hasn't expired

### Issue: Recommendations not updating
**Solution**: Verify metrics are being updated every 10-20 seconds

### Issue: Comments not saving
**Solution**: Check RLS policies and user authentication

## Success Criteria

- [ ] All notification categories work
- [ ] Follow/unfollow with notifications
- [ ] Like/unlike with counter updates
- [ ] Comments and replies work
- [ ] Recommendations show ranked content
- [ ] Discovery boost applies correctly
- [ ] Edge Functions return data
- [ ] Database queries are fast (<1s)
- [ ] No console errors
- [ ] RLS policies enforced

## Performance Benchmarks

- Notification load: < 500ms
- Like toggle: < 300ms
- Comment save: < 400ms
- Recommendations: < 1000ms
- Follow action: < 300ms

## Final Checklist

- [ ] All features tested manually
- [ ] Database verified
- [ ] Edge Functions tested
- [ ] Performance acceptable
- [ ] No breaking changes
- [ ] Documentation complete
- [ ] Ready for production

---

**Note**: Replace placeholder IDs (user1, post1, etc.) with actual IDs from your database when testing.
