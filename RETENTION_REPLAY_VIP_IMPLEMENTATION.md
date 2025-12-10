
# Retention Analytics, Replay Analytics & VIP System Implementation

## Overview
This document outlines the implementation of three major features:
1. **Retention & Session Analysis** - Track viewer retention per minute with drop moment detection
2. **Stream Replay Analytics** - Track replay engagement metrics
3. **VIP Club System Updates** - Free club creation with $3/month subscriptions

---

## 1. Retention & Session Analysis Logic

### Database Tables

#### `stream_minute_breakdown`
Tracks minute-by-minute viewer metrics during streams.

**Columns:**
- `id` (UUID) - Primary key
- `stream_id` (UUID) - References streams table
- `minute_index` (INTEGER) - Minute number in stream
- `viewers_count` (INTEGER) - Number of viewers online
- `messages_count` (INTEGER) - Number of messages sent
- `gift_value` (NUMERIC) - Total gift value in that minute

**Features:**
- Unique constraint on (stream_id, minute_index)
- Indexed for fast queries
- RLS enabled for creator access only

### Services

#### `retentionAnalyticsService.ts`
New service for retention tracking:

**Key Functions:**
- `trackMinuteBreakdown()` - Store minute-by-minute data
- `calculateAverageRetentionTime()` - Calculate avg(left_at - joined_at)
- `getRetentionCurve()` - Get full retention timeline with drop moments
- `processStreamEnd()` - Process all viewer events after stream ends

**Drop Moment Detection:**
- Identifies when >20% of viewers leave in a single minute
- Marks significant viewer loss points
- Provides percentage drop and viewer count

### UI Components

#### `RetentionAnalyticsScreen.tsx`
New screen showing:
- **Summary Cards:** Average retention time, total minutes, drop moments count
- **Retention Timeline:** Area chart with minute-by-minute viewer counts
- **Drop Moments:** Red dots marking significant viewer loss
- **Insights:** Actionable recommendations based on data

**Visualization:**
- Gradient bars for each minute
- Red bars for drop moments
- Scrollable horizontal chart
- Legend showing normal vs drop moments

---

## 2. Stream Replay Analytics

### Database Tables

#### `replay_watchlogs`
Tracks individual replay viewing sessions.

**Columns:**
- `id` (UUID) - Primary key
- `replay_id` (UUID) - References stream_replays
- `viewer_id` (UUID) - References profiles (nullable for guests)
- `watched_seconds` (INTEGER) - Total watch time
- `finished` (BOOLEAN) - Completed 95%+ of replay
- `liked` (BOOLEAN) - User liked the replay
- `commented` (BOOLEAN) - User commented
- `shared` (BOOLEAN) - User shared the replay

**Features:**
- Tracks engagement metrics per viewer
- RLS policies for privacy
- Updated in real-time during playback

### Services

#### `replayWatchService.ts`
New service for replay tracking:

**Key Functions:**
- `startWatchSession()` - Create new watch log
- `updateWatchProgress()` - Update watched seconds
- `markAsLiked/Commented/Shared()` - Track engagement
- `getEngagementSummary()` - Get aggregate metrics
- `calculateDropOffPoints()` - Find where viewers stop watching

**Engagement Metrics:**
- Total views
- Average watch time
- Completion rate (% who finish)
- Like/comment/share rates
- Top 5 drop-off points (30-second buckets)

### UI Integration

**Replay Player Updates:**
- Track watch progress every 5 seconds
- Auto-mark as finished at 95% completion
- Update engagement flags on user actions
- Display engagement summary to creator

**Creator Dashboard:**
- Replay Engagement Summary card
- Drop-off visualization
- Comparison with live stream metrics
- Monetization potential indicators

---

## 3. VIP Club System Updates

### Database Tables

#### `club_subscriptions`
New table replacing old VIP membership logic.

**Columns:**
- `id` (UUID) - Primary key
- `creator_id` (UUID) - Club owner
- `subscriber_id` (UUID) - Club member
- `subscription_price_usd` (NUMERIC) - Always $3.00
- `creator_payout_usd` (NUMERIC) - Always $2.10 (70%)
- `platform_payout_usd` (NUMERIC) - Always $0.90 (30%)
- `started_at` (TIMESTAMPTZ) - Subscription start
- `renewed_at` (TIMESTAMPTZ) - Next renewal date
- `status` (TEXT) - active/canceled/expired
- `stripe_subscription_id` (TEXT) - Stripe reference
- `stripe_customer_id` (TEXT) - Stripe customer

**Revenue Split:**
- **Member pays:** $3.00/month
- **Creator receives:** $2.10 (70%)
- **Platform receives:** $0.90 (30%)
- **Club creation:** FREE for creators

### Services

#### `clubSubscriptionService.ts`
New service for VIP club management:

**Key Functions:**
- `createClubSubscription()` - Create new subscription (FREE for creator)
- `getClubMembers()` - Get all active members with details
- `isClubMember()` - Check membership status
- `cancelSubscription()` - Cancel membership
- `renewSubscription()` - Renew for another month
- `getClubRevenueSummary()` - Calculate earnings
- `sendClubAnnouncement()` - Broadcast to all members

### UI Updates

#### `VIPClubDashboardScreen.tsx`
Updated to show:
- **Revenue Cards:** Monthly and lifetime earnings with breakdown
- **Info Banner:** "Creating a VIP Club is FREE"
- **Member List:** Username, join date, renewal date, status
- **Badge Preview:** Current club badge design
- **Announcement Tool:** Send messages to all members

#### `StreamDashboardScreen.tsx`
Consolidated menu structure:
- ✅ Club Management (VIP Club)
- ✅ Moderators List
- ✅ Streaming Analytics
- ✅ Ban / Timeout Management
- ✅ Gifts Earnings Summary
- ✅ Viewer Engagement Statistics

**Removed:** Separate "VIP System" menu item

#### `VIPClubBadge.tsx`
New component for displaying badges:
- **Visibility:** Only in creator's streams
- **Design:** Club name (max 5 chars) + heart icon
- **Colors:** Adapts to light/dark theme
- **Sizes:** Small, medium, large variants

### VIP Member Benefits

**Exclusive Features:**
1. **VIP Badge** - Visible only in creator's streams
2. **Priority Chat** - Messages highlighted/pinned
3. **Club Announcements** - Receive exclusive updates
4. **Early Access** - Future features (planned)

**Badge Rules:**
- Badge shows club name (max 5 characters)
- Colors adapt to theme (dark text in light mode, light text in dark mode)
- Only visible in streams belonging to that creator
- Not visible across other creators' streams

---

## Integration Points

### Stream End Processing
When a stream ends:
1. Calculate retention metrics via `retentionAnalyticsService.processStreamEnd()`
2. Store minute-by-minute breakdown
3. Calculate average retention time
4. Identify drop moments
5. Update creator performance scores

### Replay Creation
When saving a replay:
1. Create replay record in `stream_replays`
2. Initialize `replay_analytics` record
3. Enable watch tracking for viewers

### Replay Viewing
During replay playback:
1. Start watch session via `replayWatchService.startWatchSession()`
2. Update progress every 5 seconds
3. Track engagement actions (like, comment, share)
4. Mark as finished at 95% completion

### VIP Club Subscription Flow
When user joins a club:
1. Trigger Stripe checkout for $3/month
2. On payment success:
   - Create `club_subscriptions` entry
   - Send notifications to both parties
   - Grant VIP badge access
3. Auto-renew monthly via Stripe webhook

---

## Database Functions

### `calculate_average_retention_time(p_stream_id UUID)`
Calculates average time viewers stayed in stream.

**Returns:** NUMERIC (seconds)

### `track_stream_minute_breakdown(...)`
Upserts minute-by-minute breakdown data.

**Parameters:**
- `p_stream_id` - Stream ID
- `p_minute_index` - Minute number
- `p_viewers_count` - Viewers online
- `p_messages_count` - Messages sent
- `p_gift_value` - Gifts value

---

## RLS Policies

### `stream_minute_breakdown`
- Creators can view their own stream breakdowns
- System can insert breakdown data

### `replay_watchlogs`
- Users can view their own watch logs
- Creators can view logs for their replays
- Users can insert/update their own logs

### `club_subscriptions`
- Creators can view their club subscriptions
- Subscribers can view their own subscriptions
- System can insert/update subscriptions

---

## Testing Checklist

### Retention Analytics
- [ ] Stream ends and minute breakdown is calculated
- [ ] Average retention time is accurate
- [ ] Drop moments are correctly identified
- [ ] Retention curve displays properly
- [ ] Red dots appear on drop moments

### Replay Analytics
- [ ] Watch session starts when replay begins
- [ ] Progress updates every 5 seconds
- [ ] Finished flag set at 95% completion
- [ ] Engagement flags update on actions
- [ ] Drop-off points calculated correctly
- [ ] Creator sees engagement summary

### VIP Club System
- [ ] Club creation is FREE for creators
- [ ] Members pay $3/month via Stripe
- [ ] Revenue split is 70/30 (creator/platform)
- [ ] Badge displays only in creator's streams
- [ ] Badge colors adapt to theme
- [ ] Announcements reach all members
- [ ] Member list shows correct details
- [ ] Settings menu is consolidated

---

## API Endpoints

### Retention Analytics
- `GET /api/retention/:streamId` - Get retention curve
- `GET /api/retention/summary/:creatorId` - Get summary

### Replay Analytics
- `POST /api/replay/watch/start` - Start watch session
- `PUT /api/replay/watch/:logId/progress` - Update progress
- `PUT /api/replay/watch/:logId/like` - Mark as liked
- `GET /api/replay/:replayId/engagement` - Get summary

### VIP Club
- `POST /api/club/subscribe` - Create subscription
- `GET /api/club/:creatorId/members` - Get members
- `POST /api/club/:creatorId/announce` - Send announcement
- `DELETE /api/club/subscription/:id` - Cancel subscription

---

## Performance Considerations

### Retention Tracking
- Minute breakdown calculated post-stream (no live impact)
- Indexed queries for fast retrieval
- Batch processing for large streams

### Replay Analytics
- Progress updates throttled to 5-second intervals
- Drop-off calculation uses 30-second buckets
- Engagement summary cached for 5 minutes

### VIP Club
- Badge data cached per stream session
- Membership checks use indexed queries
- Announcement sending is async

---

## Future Enhancements

### Retention Analytics
- Heatmap visualization
- Correlation with content events
- Predictive drop moment warnings
- A/B testing for content strategies

### Replay Analytics
- Timestamp-based comments
- Replay editing tools
- Monetization options (pay-per-view)
- Highlight reel generation

### VIP Club
- Tiered membership levels
- Custom badge designs
- Exclusive content library
- Member-only streams
- Discount codes for members

---

## Migration Notes

### Existing VIP Memberships
- Old `vip_memberships` table remains for legacy data
- New subscriptions use `club_subscriptions`
- Migration script needed to convert existing members
- Badge logic updated to check both tables

### Stripe Integration
- Webhook handler updated for new subscription model
- Price ID configured for $3/month
- Revenue split handled in webhook processing
- Subscription renewal automated

---

## Support & Documentation

### For Creators
- Dashboard tutorial on first visit
- Tooltips explaining each metric
- Help center articles for each feature
- Video guides for setup

### For Developers
- API documentation in Swagger
- Service layer documentation
- Database schema diagrams
- Integration examples

---

## Conclusion

This implementation provides comprehensive analytics and monetization tools for creators while maintaining a seamless experience for viewers. The retention analytics help creators understand their audience, replay analytics extend content value, and the updated VIP system provides sustainable revenue with fair splits.

**Key Benefits:**
- ✅ Data-driven content improvement
- ✅ Extended content lifecycle via replays
- ✅ Sustainable creator revenue
- ✅ Fair platform/creator split
- ✅ Enhanced viewer engagement
- ✅ Consolidated, intuitive UI

**Next Steps:**
1. Deploy database migrations
2. Update Stripe configuration
3. Test all features end-to-end
4. Roll out to beta creators
5. Monitor metrics and iterate
