
# Analytics Tracking System Implementation

## Overview
This document describes the comprehensive analytics tracking system implemented for the Roast Live streaming platform. The system tracks viewer behavior, stream performance, and creator metrics without modifying any existing live streaming API, Cloudflare integration, or live start/stop logic.

## Database Schema

### 1. stream_metrics
Stores aggregated metrics for each completed stream.

**Columns:**
- `id` (UUID) - Primary key
- `stream_id` (UUID) - Reference to streams table
- `creator_id` (UUID) - Reference to profiles table
- `created_at` (TIMESTAMPTZ) - Stream start time
- `ended_at` (TIMESTAMPTZ) - Stream end time
- `avg_session_length_seconds` (INTEGER) - Average viewer session duration
- `peak_viewers` (INTEGER) - Maximum concurrent viewers
- `total_unique_viewers` (INTEGER) - Total unique viewers
- `total_gift_value` (NUMERIC) - Total value of gifts received
- `total_messages_sent` (INTEGER) - Total chat messages
- `bounce_rate_percent` (NUMERIC) - Percentage of viewers who left within 20 seconds
- `returning_viewers_count` (INTEGER) - Number of viewers who were already following
- `guest_count` (INTEGER) - Number of guests who joined the stream

**RLS Policies:**
- Creators can view their own stream metrics
- Admins (HEAD_ADMIN, ADMIN, SUPPORT) can view all metrics
- System can insert and update metrics

### 2. viewer_events
Tracks individual viewer sessions during streams.

**Columns:**
- `id` (UUID) - Primary key
- `stream_id` (UUID) - Reference to streams table
- `viewer_id` (UUID) - Reference to profiles table
- `joined_at` (TIMESTAMPTZ) - When viewer joined
- `left_at` (TIMESTAMPTZ) - When viewer left (null if still watching)
- `device_type` (TEXT) - 'mobile', 'web', or 'tablet'
- `was_following_before_join` (BOOLEAN) - Whether viewer was already following creator
- `gifted_amount` (NUMERIC) - Total value of gifts sent during session
- `messages_sent` (INTEGER) - Number of messages sent during session
- `created_at` (TIMESTAMPTZ) - Record creation time

**RLS Policies:**
- Creators can view viewer events for their own streams
- Admins can view all viewer events
- System can insert and update events

### 3. creator_performance_scores
Stores calculated performance scores for creators.

**Columns:**
- `id` (UUID) - Primary key
- `creator_id` (UUID) - Reference to profiles table (unique)
- `last_7_days_score` (INTEGER) - Performance score for last 7 days (0-100)
- `last_30_days_score` (INTEGER) - Performance score for last 30 days (0-100)
- `lifetime_score` (INTEGER) - All-time performance score (0-100)
- `created_at` (TIMESTAMPTZ) - Record creation time
- `updated_at` (TIMESTAMPTZ) - Last update time

**Score Calculation:**
Weighted average based on:
- Average watch duration (25 points max)
- Gift conversion rate (25 points max)
- Follower retention (25 points max)
- Average viewer count (25 points max)

**Score Labels:**
- 0-24: Rookie
- 25-49: Growing
- 50-79: Rising Talent
- 80-100: Elite Creator

**RLS Policies:**
- Creators can view their own performance scores
- Admins can view all performance scores
- System can insert and update scores

## Services

### analyticsService.ts
Main service for analytics tracking and data aggregation.

**Key Functions:**
- `trackViewerJoin()` - Track when a viewer joins a stream
- `trackViewerLeave()` - Track when a viewer leaves a stream
- `updateViewerGiftAmount()` - Update gift amount for a viewer session
- `incrementViewerMessageCount()` - Increment message count for a viewer session
- `calculateStreamMetrics()` - Calculate and store metrics after stream ends
- `updateCreatorPerformanceScores()` - Update creator performance scores
- `getAnalyticsSummary()` - Get analytics summary for creator dashboard
- `getCreatorPerformanceScore()` - Get creator performance score
- `getAdminAnalytics()` - Get admin analytics data

## UI Screens

### 1. PerformanceGrowthScreen.tsx
Creator analytics dashboard accessible from Settings → Stream Dashboard → Analytics.

**Sections:**
1. **Creator Score Badge**
   - Current score (0-100)
   - Score label (Rookie/Growing/Rising Talent/Elite Creator)
   - 7-day, 30-day, and lifetime scores
   - Color-coded badge (red/orange/green)

2. **Latest Stream Summary**
   - Peak Viewers
   - Total Watch Time
   - Total Revenue from Gifts
   - Conversion to Followers
   - Avg Viewer Session Duration

3. **Earnings Analytics**
   - Total gift value
   - Top gifting viewers (top 10)
   - Conversion funnel: viewers → chatters → gifters

4. **Audience Segments**
   - New viewers
   - Returning viewers
   - Loyal core audience

5. **30-Day Trends** (placeholder for future implementation)
   - Viewership curve (line chart)
   - Followers gained from streams (bar chart)
   - Retention rate daily (bar chart)

### 2. AdminAnalyticsScreen.tsx
Admin-only analytics screen accessible from Settings → Admin Dashboard → Analytics Dashboard.

**Access Control:**
- Visible to: HEAD_ADMIN, ADMIN
- Read-only access: SUPPORT
- No access: MODERATOR

**Sections:**
1. **Earnings Summary**
   - Daily total gift value
   - Weekly total gift value
   - Export CSV button

2. **Active Streams Monitor**
   - Creator name
   - Current viewers
   - Duration live
   - Guest count
   - "Open Creator Profile" button

3. **Growth Leaderboard (Last 7 Days)**
   - Creator name
   - Streams hosted
   - Avg session duration
   - Total gifts received
   - Performance score

4. **Flagged Streams**
   - Stream ID
   - Creator name
   - Number of reports
   - Admin actions:
     - Issue Warning
     - Timeout Creator (global)
     - Remove stream replay

## Integration Points

### 1. Viewer Tracking Service
Updated `viewerTrackingService.ts` to integrate with analytics:
- Tracks viewer joins with device type and following status
- Tracks viewer leaves
- Calculates and stores stream metrics when stream ends

### 2. Gift Service
Updated `giftService.ts` to track gift amounts:
- Updates viewer gift amount in analytics when gift is sent during livestream

### 3. Chat/Messaging
Should be integrated to track message counts:
- Call `analyticsService.incrementViewerMessageCount()` when viewer sends message

## Data Flow

### Stream Start
1. Viewer joins stream
2. `viewerTrackingService.joinStream()` called
3. Creates record in `stream_viewers` table
4. Creates record in `viewer_events` table with device type and following status

### During Stream
1. Viewer sends gift
   - `giftService.purchaseGift()` called
   - Updates `gifted_amount` in `viewer_events` table

2. Viewer sends message
   - Chat service should call `analyticsService.incrementViewerMessageCount()`
   - Updates `messages_sent` in `viewer_events` table

### Stream End
1. Stream ends
2. `viewerTrackingService.cleanupStreamViewers()` called
3. Updates all active viewer sessions with `left_at` timestamp
4. Calls `analyticsService.calculateStreamMetrics()`
5. Aggregates all viewer events into `stream_metrics` table
6. Calculates:
   - Peak viewers (by analyzing join/leave timeline)
   - Average session length
   - Bounce rate (viewers who left within 20 seconds)
   - Total unique viewers
   - Total gift value
   - Total messages sent
   - Returning viewers count
   - Guest count
7. Updates creator performance scores in `creator_performance_scores` table

## Performance Considerations

### Indexes
Created indexes for optimal query performance:
- `idx_stream_metrics_creator_id` - For creator-specific queries
- `idx_stream_metrics_stream_id` - For stream-specific queries
- `idx_stream_metrics_created_at` - For time-based queries
- `idx_viewer_events_stream_id` - For stream viewer queries
- `idx_viewer_events_viewer_id` - For viewer-specific queries
- `idx_viewer_events_joined_at` - For time-based queries
- `idx_creator_performance_scores_creator_id` - For creator score queries
- `idx_creator_performance_scores_last_7_days_score` - For leaderboard queries
- `idx_creator_performance_scores_last_30_days_score` - For leaderboard queries

### Caching Strategy
- Analytics summaries can be cached for 5-10 minutes
- Performance scores can be cached for 1 hour
- Admin analytics can be cached for 1 minute

## Future Enhancements

### 1. Trend Graphs
Implement actual chart components for:
- Viewership curve over time
- Follower growth over time
- Retention rate over time

### 2. Real-time Analytics
Add real-time updates during live streams:
- Live viewer count graph
- Live gift value counter
- Live message rate

### 3. Advanced Metrics
Add more sophisticated metrics:
- Viewer engagement score
- Chat sentiment analysis
- Peak engagement moments
- Viewer retention curve

### 4. Export Functionality
Implement CSV export for:
- Stream metrics
- Viewer events
- Performance scores
- Admin analytics

### 5. Comparative Analytics
Add comparison features:
- Compare streams
- Compare time periods
- Compare with platform averages

## Testing Checklist

### Creator Dashboard
- [ ] Analytics button appears in Stream Dashboard
- [ ] Performance & Growth screen loads correctly
- [ ] Creator score displays with correct color
- [ ] Latest stream summary shows accurate data
- [ ] Earnings analytics displays correctly
- [ ] Top gifters list shows correct data
- [ ] Audience segments display correctly
- [ ] Empty state shows when no data available

### Admin Dashboard
- [ ] Analytics Dashboard button appears for admins
- [ ] Access control works correctly (HEAD_ADMIN, ADMIN, SUPPORT)
- [ ] Earnings summary displays correctly
- [ ] Active streams list shows current streams
- [ ] Growth leaderboard displays correctly
- [ ] Flagged streams list shows reported streams
- [ ] Admin actions work correctly (warnings, timeouts, replay removal)
- [ ] Export CSV button is functional

### Data Tracking
- [ ] Viewer join events are tracked correctly
- [ ] Viewer leave events are tracked correctly
- [ ] Gift amounts are tracked correctly
- [ ] Message counts are tracked correctly
- [ ] Stream metrics are calculated correctly after stream ends
- [ ] Performance scores are updated correctly
- [ ] Device type detection works correctly
- [ ] Following status is tracked correctly

### Performance
- [ ] Queries execute within acceptable time limits
- [ ] Indexes are being used effectively
- [ ] No N+1 query issues
- [ ] Caching is working correctly

## Deployment Notes

### Database Migration
Run the migration `create_analytics_tracking_tables` to create all necessary tables, indexes, and RLS policies.

### Service Integration
Ensure the following services are properly integrated:
1. `viewerTrackingService` - Already integrated
2. `giftService` - Already integrated
3. Chat/messaging service - Needs integration for message count tracking

### Environment Variables
No new environment variables required.

### Monitoring
Monitor the following:
- Analytics calculation performance
- Database query performance
- Storage growth of analytics tables
- RLS policy effectiveness

## Support

For issues or questions about the analytics system:
1. Check the implementation files:
   - `app/services/analyticsService.ts`
   - `app/screens/PerformanceGrowthScreen.tsx`
   - `app/screens/AdminAnalyticsScreen.tsx`
2. Review the database schema and RLS policies
3. Check the integration points in existing services
4. Verify data is being tracked correctly in the database tables

## Conclusion

The analytics tracking system provides comprehensive insights into stream performance, viewer behavior, and creator growth without modifying any existing streaming functionality. The system is designed to be scalable, performant, and easy to extend with additional metrics and features in the future.
