
# Network Stability, Recommendation Algorithm & Behavioral Safety Implementation

This document describes the implementation of three major features:
1. Livestream Network Stability & Reconnect System
2. TikTok-Style Recommendation Algorithm
3. Advanced Anti-Abuse Behavioral Safety System

## 1. Livestream Network Stability & Reconnect System

### Overview
Provides automatic network monitoring, quality detection, and reconnection logic for livestreams without modifying Cloudflare APIs or tokens.

### Features
- **Network Quality Detection**: Monitors bitrate, packet loss, and latency
- **Poor Connection Warning**: Shows "Poor connection detected" when quality degrades
- **Auto-Reconnect**: Automatically reconnects to existing stream session
- **Smart Resume Logic**:
  - Connection lost < 15 sec → auto resume
  - Connection lost > 15 sec → show "Tap to reconnect"
- **Background Mode**: Keeps camera alive in PiP preview (like FaceTime)
- **Viewer Fallback**: Automatic lower-quality playback for viewers

### Implementation

#### Service: `networkStabilityService.ts`
```typescript
// Start monitoring
networkStabilityService.startMonitoring(streamId, (quality) => {
  console.log('Network quality:', quality.status);
});

// Check if auto-resume is possible
const canResume = networkStabilityService.canAutoResume();

// Attempt reconnect
await networkStabilityService.attemptReconnect(
  onSuccess,
  onFailed
);

// Stop monitoring
networkStabilityService.stopMonitoring();
```

#### Component: `NetworkStabilityIndicator.tsx`
Displays network status and reconnect UI:
- ⚠️ Poor connection warning
- ❌ Connection lost indicator
- Auto-reconnecting status
- "Tap to reconnect" button

### Usage in BroadcasterScreen

```typescript
import { networkStabilityService } from '@/app/services/networkStabilityService';
import NetworkStabilityIndicator from '@/components/NetworkStabilityIndicator';

// In component
<NetworkStabilityIndicator
  isStreaming={isStreaming}
  streamId={streamId}
  onReconnect={handleReconnect}
/>
```

### WebRTC Integration

For production, integrate with WebRTC peer connection:

```typescript
// Get real-time stats from WebRTC
const quality = await networkStabilityService.getWebRTCStats(peerConnection);

// Monitor connection state
peerConnection.onconnectionstatechange = () => {
  if (peerConnection.connectionState === 'disconnected') {
    networkStabilityService.handleConnectionLoss();
  }
};
```

---

## 2. TikTok-Style Recommendation Algorithm

### Overview
Personalized content recommendation engine using multiple signals and a weighted ranking formula.

### Ranking Formula
```
score = w1*watch_time + w2*completion + w3*like_ratio + w4*recent_trend + w5*creator_affinity
```

### Default Weights
- `w1_watch_time`: 0.30 (30%)
- `w2_completion`: 0.25 (25%)
- `w3_like_ratio`: 0.20 (20%)
- `w4_recent_trend`: 0.15 (15%)
- `w5_creator_affinity`: 0.10 (10%)

### Signals Tracked
1. **watch_time**: Total seconds watched
2. **completion_rate**: Percentage of content completed (0-1)
3. **replay_count**: Number of times replayed
4. **likes**: Total likes received
5. **comments_received**: Total comments
6. **shares**: Total shares
7. **creator_followed**: Whether user follows creator
8. **content_category**: Content classification
9. **safety_score**: Content safety rating (0-1)

### Feed Rules
- Don't show same creator more than 3 times in a row
- Hide content from blocked users
- Boost Premium creators (+20%)
- Boost VIP creators (+30%)

### Database Tables

#### `content_engagement_metrics`
Tracks user engagement with content:
```sql
- id: UUID
- content_type: 'stream' | 'replay' | 'post' | 'story'
- content_id: UUID
- user_id: UUID
- watch_time_seconds: INTEGER
- completion_rate: NUMERIC
- replay_count: INTEGER
- liked: BOOLEAN
- commented: BOOLEAN
- shared: BOOLEAN
- creator_followed: BOOLEAN
- content_category: TEXT
- safety_score: NUMERIC
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### `user_feed_preferences`
Stores user preferences:
```sql
- id: UUID
- user_id: UUID
- preferred_categories: TEXT[]
- blocked_creator_ids: UUID[]
- last_creator_shown: UUID
- creator_show_count: INTEGER
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### Usage

#### Track Engagement
```typescript
import { enhancedRecommendationService } from '@/app/services/enhancedRecommendationService';

// Track user engagement
await enhancedRecommendationService.trackEngagement(
  userId,
  'stream',
  streamId,
  {
    watchTimeSeconds: 120,
    completionRate: 0.8,
    liked: true,
    commented: false,
    shared: false,
    creatorFollowed: true,
  }
);
```

#### Get Personalized Feed
```typescript
// Get personalized live streams
const liveStreams = await enhancedRecommendationService.getPersonalizedFeed(
  userId,
  'stream',
  20
);

// Get personalized replays
const replays = await enhancedRecommendationService.getPersonalizedFeed(
  userId,
  'replay',
  20
);
```

#### Update Feed Preferences
```typescript
await enhancedRecommendationService.updateFeedPreferences(userId, {
  preferredCategories: ['gaming', 'music'],
  blockedCreatorIds: ['creator-uuid-1', 'creator-uuid-2'],
});
```

---

## 3. Advanced Anti-Abuse Behavioral Safety System

### Overview
AI-powered behavioral analysis system that detects patterns and takes automated actions.

### Detection Categories

#### 1. Toxic Comments
- Monitors comment toxicity scores
- Pattern: 3+ toxic comments in 24 hours
- Action: Soft warning → Shadow-ban

#### 2. Harassment Patterns
- Tracks repeated harassment of specific users
- Pattern: 3+ harassment violations in 7 days
- Action: Escalate to human review

#### 3. Repeated Reports
- Monitors reports against a user
- Pattern: 5+ reports in 7 days
- Action: Escalate to human review

#### 4. Multi-Account Patterns
- Detects same device used by multiple accounts
- Pattern: 3+ accounts on same device
- Action: Escalate to human review

#### 5. Fake Engagement - Spam Liking
- Detects rapid liking behavior
- Pattern: 20+ likes in 1 hour
- Action: Auto timeout (30 minutes)

#### 6. Fake Engagement - Spam Following
- Detects rapid following behavior
- Pattern: 10+ follows in 1 hour
- Action: Auto timeout (60 minutes)

### Actions

#### Soft Warning
- Sends inbox message to user
- No restrictions applied
- Used for first-time minor violations

#### Shadow-Ban
- Comments visible only to sender
- Duration: 24 hours
- User notified via inbox

#### Auto Timeout
- Temporary restriction from participation
- Duration: 30-60 minutes
- User notified via inbox

#### Human Review
- Escalates to moderator review queue
- Creates entry in `moderator_review_queue`
- Admin dashboard notification

### Database Table

#### `user_safety_events`
```sql
- id: UUID
- user_id: UUID
- event_type: TEXT (toxic_comment, harassment_pattern, etc.)
- severity: TEXT (low, medium, high, critical)
- details: JSONB
- action_taken: TEXT (soft_warning, shadow_ban, auto_timeout, human_review)
- related_user_id: UUID (optional)
- stream_id: UUID (optional)
- created_at: TIMESTAMPTZ
- resolved_at: TIMESTAMPTZ
- resolved_by: UUID
```

### Usage

#### Run Safety Check
```typescript
import { behavioralSafetyService } from '@/app/services/behavioralSafetyService';

// Run comprehensive safety check
const result = await behavioralSafetyService.runSafetyCheck(userId, streamId);

if (!result.passed) {
  console.log('Safety issues detected:', result.issues);
}
```

#### Detect Specific Patterns
```typescript
// Detect toxic comments
const hasToxicPattern = await behavioralSafetyService.detectToxicComments(
  userId,
  streamId
);

// Detect harassment
const hasHarassment = await behavioralSafetyService.detectHarassmentPattern(
  userId,
  targetUserId,
  streamId
);

// Detect spam liking
const hasSpamLiking = await behavioralSafetyService.detectSpamLiking(userId);
```

#### Get Safety Events
```typescript
// Get user's safety events
const events = await behavioralSafetyService.getUserSafetyEvents(userId, 50);

// Get all unresolved events (admin)
const unresolved = await behavioralSafetyService.getUnresolvedSafetyEvents(100);
```

#### Resolve Safety Event
```typescript
// Admin resolves safety event
await behavioralSafetyService.resolveSafetyEvent(eventId, adminId);
```

### Integration with Existing Systems

The behavioral safety service integrates with:
- **AI Moderation Service**: Uses existing violation detection
- **Inbox Service**: Sends notifications to users
- **Moderator Review Queue**: Escalates critical issues
- **Device Ban Service**: Checks device fingerprints

---

## Testing

### Network Stability Testing
1. Start a livestream
2. Toggle airplane mode to simulate connection loss
3. Verify auto-reconnect within 15 seconds
4. Wait > 15 seconds and verify "Tap to reconnect" appears
5. Test manual reconnect button

### Recommendation Algorithm Testing
1. Track engagement for multiple streams
2. Verify personalized feed shows relevant content
3. Check that same creator doesn't appear 3+ times in a row
4. Verify Premium/VIP creators get boosted

### Behavioral Safety Testing
1. Create test violations (toxic comments)
2. Verify soft warning is sent
3. Continue violations and verify shadow-ban
4. Test spam liking (20+ likes in 1 hour)
5. Verify auto timeout is applied
6. Check admin dashboard for escalated events

---

## Admin Dashboard Integration

### Safety Events Dashboard
Display unresolved safety events:
```typescript
const events = await behavioralSafetyService.getUnresolvedSafetyEvents(100);

// Show in admin UI:
// - User info
// - Event type
// - Severity
// - Details
// - Action taken
// - Resolve button
```

### Recommendation Analytics
Track recommendation performance:
```typescript
// Get trending content
const trending = await enhancedRecommendationService.getTrendingContent('stream', 20);

// Analyze engagement metrics
// - Average watch time
// - Completion rates
// - Like ratios
// - Creator affinity scores
```

---

## Performance Considerations

### Network Monitoring
- Checks every 5 seconds (configurable)
- Minimal battery impact
- Uses native Network API

### Recommendation Engine
- Caches user preferences
- Batch processes engagement metrics
- Indexes on user_id and content_id

### Safety Detection
- Runs checks on user actions
- Batches database queries
- Uses indexes on user_id and created_at

---

## Future Enhancements

### Network Stability
- [ ] Adaptive bitrate streaming
- [ ] Network quality prediction
- [ ] Bandwidth estimation
- [ ] Connection type optimization

### Recommendation Algorithm
- [ ] Machine learning model integration
- [ ] A/B testing framework
- [ ] Real-time weight adjustment
- [ ] Content similarity matching

### Behavioral Safety
- [ ] Advanced pattern recognition
- [ ] Sentiment analysis
- [ ] Image/video content moderation
- [ ] Cross-platform behavior tracking

---

## Support

For issues or questions:
1. Check the implementation files
2. Review the database schema
3. Test with the provided examples
4. Contact the development team

---

## Changelog

### Version 1.0.0 (2024)
- Initial implementation
- Network stability monitoring
- Recommendation algorithm
- Behavioral safety system
- Database migrations
- Documentation
