
# VIP Fan Club & Comment Interaction System Implementation

## Overview
This document outlines the complete implementation of the VIP Fan Club system, Comment Interaction features, and Role-based Permissions for the Roast Live app.

## Features Implemented

### 1. VIP Fan Club System

#### Eligibility
- Streamers must have **10+ hours** of total streaming time to create a fan club
- Streaming hours are tracked in the `profiles.total_streaming_hours` column
- Hours are automatically updated when streams end

#### Fan Club Creation
- **Club Name**: Maximum 5 characters
- **Badge Color**: Choose from 8 predefined colors
- **Subscription Price**: €2.58/month (streamer earns 70%)
- **Management Panel**: Located in Stream Dashboard → Fan Club

#### Fan Club Features
- Members receive an exclusive badge during the streamer's livestreams
- Badge appears in:
  - Chat messages
  - Viewer list
  - Moderation modal
- Badge does NOT appear on profiles outside livestreams
- Membership persists across all future streams from that streamer

#### Fan Club Management
- **Rename Club**: Update club name (max 5 chars)
- **Change Badge Color**: Select from color palette
- **View Members**: See all active subscribers
- **Add as Moderator**: Promote members to moderators
- **Remove Members**: Remove users from fan club

### 2. Comment Interaction System

#### Viewer Interactions
- **Like Comments**: All viewers can like any comment
- **Report Comments**: Report spam, harassment, or inappropriate content
- **Block Users**: Block users to hide their messages and profiles
- **Visit Profiles**: Tap on usernames to view profiles

#### Blocking Behavior
- Blocked users' chat messages are hidden
- Profiles are hidden from each other
- Unblocking managed in Settings → Blocked Users

#### Moderator Interactions
- **Pin Comments**: Pin for 1-5 minutes
- **Timeout Users**: Mute for 1-60 minutes
- **Ban Users**: Permanently ban from streams
- **Delete Comments**: Remove inappropriate messages
- **Like Comments**: Show support for good comments

#### Streamer Interactions
- All moderator permissions PLUS:
- **Add/Remove Moderators**: Manage up to 30 moderators
- **Manage Fan Club**: Control fan club settings and members
- **Manage Banned Users**: View and unban users

### 3. Pinned Comment Behavior
- Appears at top of chat overlay
- Auto-unpins after selected duration (1-5 minutes)
- Only one pinned comment at a time
- Highlighted with gold border and pin icon

### 4. Timeout System
- User is muted from chat for selected duration
- Auto-unmute when timer ends
- Timeout only applies to current stream session

### 5. Ban System
- User is immediately kicked from stream
- Ban persists across all future streams from same streamer
- Only affects this streamer's livestreams, not others
- Banned users cannot view or participate in streams

### 6. Roles & Permissions

#### Streamer
- Full permissions
- Assign/remove moderators (max 30)
- View banned users
- Manage Fan Club
- Pin comments
- Timeout/ban/remove users
- Manage badges

#### Moderator
- Timeout users (1-60 minutes)
- Ban users
- Delete comments
- Pin comments (1-5 minutes)
- Like comments
- **Cannot** modify fan club
- **Cannot** add/remove moderators

#### Fan Club Member
- Badge visible in streamer's lives
- No moderation powers
- Special recognition in chat

#### Viewer
- Can comment
- Like comments
- Block users
- Report comments
- View profiles

## Database Schema

### New Tables

#### `blocked_users`
```sql
- id: UUID (primary key)
- blocker_id: UUID (references profiles)
- blocked_id: UUID (references profiles)
- created_at: TIMESTAMPTZ
- UNIQUE(blocker_id, blocked_id)
```

#### `comment_reports`
```sql
- id: UUID (primary key)
- message_id: UUID (references chat_messages)
- reporter_id: UUID (references profiles)
- reason: TEXT
- created_at: TIMESTAMPTZ
- UNIQUE(message_id, reporter_id)
```

### Modified Tables

#### `profiles`
- Added `total_streaming_hours: DECIMAL(10, 2)` - Tracks total streaming time

#### `fan_clubs`
- Already exists with proper structure
- `club_name`: Max 5 characters
- `badge_color`: Hex color code
- `streamer_id`: Unique per streamer

#### `fan_club_members`
- Already exists with proper structure
- `subscription_start`: When membership began
- `subscription_end`: When membership expires
- `is_active`: Active status
- UNIQUE(fan_club_id, user_id)

## Services

### `fanClubService.ts`
- `canCreateFanClub()`: Check if user has 10+ hours
- `getStreamingHours()`: Get total streaming hours
- `createFanClub()`: Create new fan club
- `updateFanClub()`: Update club name/color
- `getFanClub()`: Get fan club by streamer
- `joinFanClub()`: Subscribe to fan club
- `leaveFanClub()`: Unsubscribe from fan club
- `removeMember()`: Remove member (streamer action)
- `isFanClubMember()`: Check membership status
- `isMemberOfStreamerFanClub()`: Check if user is member of specific streamer's club
- `getFanClubMembers()`: Get all active members
- `getFanClubBadge()`: Get badge info for user in stream
- `updateStreamingHours()`: Update hours after stream ends

### `userBlockingService.ts`
- `blockUser()`: Block a user
- `unblockUser()`: Unblock a user
- `isBlocked()`: Check if user is blocked
- `isMutuallyBlocked()`: Check mutual block status
- `getBlockedUsers()`: Get all blocked users
- `reportComment()`: Report a comment

### `moderationService.ts` (Enhanced)
- All existing moderation functions
- Integrated with fan club badges
- Integrated with blocking system

## UI Components

### New Screens
1. **FanClubManagementScreen**: Full fan club management interface
2. **BlockedUsersScreen**: View and manage blocked users

### New Components
1. **EnhancedChatOverlay**: Chat with badges, interactions, and moderation
2. **FanClubJoinModal**: Subscribe to fan club modal

### Updated Components
1. **ViewerListModal**: Shows fan club and moderator badges
2. **StreamDashboardScreen**: Added quick actions for Fan Club and Blocked Users
3. **AccountSettingsScreen**: Added link to Blocked Users

## Real-time Features

### Supabase Channels
- `stream:{streamId}:chat`: Chat messages
- `stream:{streamId}:gifts`: Gift notifications
- `stream:{streamId}:moderation`: Moderation actions

### Broadcast Events
- `message`: New chat message
- `gift_sent`: Gift sent notification
- `comment_removed`: Comment deleted
- `comment_pinned`: Comment pinned
- `comment_unpinned`: Comment unpinned
- `user_banned`: User banned from stream
- `user_timed_out`: User timed out

## Badge Display Logic

### Badge Priority (displayed in order)
1. **Moderator Badge**: Shield icon, gradient color
2. **Fan Club Badge**: Heart icon, custom club color

### Badge Visibility
- **In Livestream**:
  - ✅ Chat messages
  - ✅ Viewer list
  - ✅ Moderation modal
  - ✅ Pinned comments

- **Outside Livestream**:
  - ❌ User profiles
  - ❌ Post comments
  - ❌ Story comments

## Monetization Flow

### Fan Club Subscription
1. User clicks "Join Fan Club" button
2. Modal shows club details and pricing (€2.58/month)
3. User confirms subscription
4. Payment processed (integration pending)
5. User immediately receives badge in current livestream
6. Membership persists for 30 days
7. Streamer earns 70% (€1.81) per subscription

### Revenue Split
- **Platform**: 30% (€0.77)
- **Streamer**: 70% (€1.81)

## Navigation Flow

### For Streamers
1. Profile → Settings → Stream Dashboard
2. Stream Dashboard → Fan Club (Quick Action)
3. Stream Dashboard → Blocked Users (Quick Action)
4. Stream Dashboard → Moderators
5. Stream Dashboard → Banned Users

### For Viewers
1. During Livestream → Tap viewer count → View badges
2. During Livestream → Long-press comment → Report/Block
3. Profile → Settings → Blocked Users

## Testing Checklist

### Fan Club
- [ ] Create fan club with 10+ hours
- [ ] Cannot create with <10 hours
- [ ] Update club name (max 5 chars)
- [ ] Change badge color
- [ ] Join fan club as viewer
- [ ] Badge appears in chat
- [ ] Badge appears in viewer list
- [ ] Leave fan club
- [ ] Remove member as streamer
- [ ] Add member as moderator

### Comment Interactions
- [ ] Like comment as viewer
- [ ] Report comment with reason
- [ ] Block user from chat
- [ ] Blocked user's messages hidden
- [ ] Unblock user from settings
- [ ] Pin comment as moderator (1-5 min)
- [ ] Pinned comment auto-unpins
- [ ] Timeout user (1-60 min)
- [ ] Timeout auto-expires
- [ ] Ban user permanently
- [ ] Banned user kicked from stream
- [ ] Delete comment as moderator

### Roles & Permissions
- [ ] Streamer can add moderators
- [ ] Streamer can remove moderators
- [ ] Max 30 moderators enforced
- [ ] Moderator can timeout users
- [ ] Moderator can ban users
- [ ] Moderator can pin comments
- [ ] Moderator cannot manage fan club
- [ ] Viewer can like comments
- [ ] Viewer can report comments
- [ ] Viewer can block users

## Future Enhancements

### Payment Integration
- Integrate Stripe for subscriptions
- Auto-renewal handling
- Payment failure notifications
- Subscription management

### Analytics
- Track fan club revenue
- Monitor subscription retention
- Analyze member engagement
- Report generation

### Additional Features
- Custom badge designs
- Multiple membership tiers
- Exclusive emotes for members
- Member-only chat rooms
- Special perks and rewards

## Notes

### Performance Considerations
- Fan club badge lookups are cached during livestream
- Moderator lists are cached and refreshed periodically
- Blocked user checks are performed client-side after initial fetch
- Real-time updates use Supabase broadcast for scalability

### Security
- RLS policies enforce user permissions
- Blocked users cannot bypass restrictions
- Moderator actions are logged
- Ban/timeout durations are validated server-side

### UX Improvements
- Smooth animations for badge display
- Clear visual feedback for actions
- Confirmation dialogs for destructive actions
- Loading states for all async operations

## Support

For issues or questions:
1. Check database migrations are applied
2. Verify RLS policies are enabled
3. Check Supabase logs for errors
4. Review real-time channel subscriptions
5. Test with multiple users for real-time features
