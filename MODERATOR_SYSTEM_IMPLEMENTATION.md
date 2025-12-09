
# Moderator System Implementation

## Overview
A complete TikTok-style moderator system has been implemented for livestreams, allowing streamers to manage their community effectively without affecting the core streaming logic.

## Database Tables Created

### 1. `moderators`
- Stores moderator assignments for each streamer
- Maximum of 30 moderators per streamer (enforced by trigger)
- Unique constraint on (streamer_id, user_id)
- RLS policies allow streamers to manage their own moderators

### 2. `banned_users`
- Stores banned users per streamer
- Bans persist across all future streams by the same streamer
- Optional reason field for ban documentation
- RLS policies allow streamers to manage their own bans

### 3. `timed_out_users`
- Stores temporary timeouts (1-60 minutes)
- Automatically expires after the timeout period
- Unique constraint on (stream_id, user_id)
- RLS policies allow streamers and moderators to manage timeouts

### 4. `pinned_comments`
- Stores pinned comments (1-5 minutes)
- Only one pinned comment per stream at a time
- Automatically expires after the pin duration
- RLS policies allow streamers and moderators to pin comments

### 5. `comment_likes`
- Stores likes on chat messages
- Allows moderators to highlight good comments
- RLS policies allow users to manage their own likes

## Features Implemented

### 1. User Action Modal
**Location:** `components/UserActionModal.tsx`

Streamers and moderators can tap on any viewer or chat message to open a modal with actions:
- **Add Moderator** (streamer only)
- **Remove Moderator** (streamer only)
- **Ban User** (streamer and moderators)
- **Unban User** (streamer only)
- **Timeout User** (streamer and moderators) - Select duration 1-60 minutes
- **View Profile** (everyone)

### 2. Moderator Permissions
Moderators can:
- ✅ Timeout any viewer (1-60 minutes)
- ✅ Ban viewers from the current stream
- ✅ Remove comments
- ✅ Pin comments (1-5 minutes)
- ✅ Like comments

### 3. Moderator Persistence
- Streamers can have up to 30 moderators
- Moderators are saved in the database
- Automatically apply to all future streams from the same streamer
- Moderators are NOT global—only valid for the streamer who assigned them

### 4. Stream Dashboard
**Location:** `app/screens/StreamDashboardScreen.tsx`

Accessible from Settings → Stream Dashboard:
- **Moderators Section:**
  - List of current moderators with avatars
  - Remove moderator button
  - Add moderator manually by username search
  - Shows moderator count (X/30)
  
- **Banned Users Section:**
  - List of banned users with avatars
  - Remove ban button
  - Shows ban reason if provided

### 5. Live Stream Moderation Panel
**Location:** `components/ModeratorControlPanel.tsx`

During livestream, streamers can open a panel (shield icon on right side) to:
- Add moderator by username search
- Remove moderator
- View list of current moderators
- View list of banned users
- Unban users
- Manage moderation in real-time

### 6. Enhanced Chat Overlay
**Location:** `components/ModeratorChatOverlay.tsx`

Features:
- **Pinned Comments:** Shows pinned comment at the top with gold border
- **Moderator Actions:** Quick buttons on each message for:
  - Like comment (heart icon)
  - Pin comment (pin icon)
  - Remove comment (trash icon)
- **Long Press:** Long press on any message to open user action modal
- **Badges:** Shows moderator/fan badges next to usernames
- **Real-time Updates:** Listens for moderation events and updates UI

### 7. Enhanced Viewer List
**Location:** `components/ViewerListModal.tsx`

- Tap on any viewer to open user action modal
- Shows viewer avatars and usernames
- Real-time viewer count updates
- Moderators and streamers can take action on viewers

## Ban Logic

### Immediate Effects:
1. User is immediately removed from the stream
2. Ban is broadcast to all viewers
3. User cannot rejoin the stream

### Persistence:
- Ban persists across all future streams by the same streamer
- Ban only affects this streamer's livestreams, not others
- Streamer can unban users from Stream Dashboard or Moderation Panel

## Timeout Logic

### Duration:
- Minimum: 1 minute
- Maximum: 60 minutes
- Quick select buttons: 1m, 5m, 10m, 30m, 60m

### Effects:
- User cannot send chat messages during timeout period
- Timeout automatically expires after timer ends
- Timeout is specific to the current stream
- Moderators and streamers can timeout users

## Service Layer
**Location:** `app/services/moderationService.ts`

Provides all moderation functionality:
- `isModerator()` - Check if user is a moderator
- `isBanned()` - Check if user is banned
- `isTimedOut()` - Check if user is timed out
- `addModerator()` - Add a moderator
- `removeModerator()` - Remove a moderator
- `getModerators()` - Get all moderators for a streamer
- `banUser()` - Ban a user
- `unbanUser()` - Unban a user
- `getBannedUsers()` - Get all banned users for a streamer
- `timeoutUser()` - Timeout a user
- `removeComment()` - Remove a chat message
- `pinComment()` - Pin a comment
- `unpinComment()` - Unpin a comment
- `getPinnedComment()` - Get the current pinned comment
- `likeComment()` - Like a comment
- `unlikeComment()` - Unlike a comment
- `getCommentLikesCount()` - Get like count for a comment
- `searchUsersByUsername()` - Search users for adding moderators

## Real-time Updates

### Channels:
1. **Chat Channel:** `stream:{streamId}:chat`
   - Broadcasts new chat messages
   
2. **Gift Channel:** `stream:{streamId}:gifts`
   - Broadcasts gift events
   
3. **Moderation Channel:** `stream:{streamId}:moderation`
   - Broadcasts moderation events:
     - `user_banned` - User was banned
     - `user_timed_out` - User was timed out
     - `comment_removed` - Comment was removed
     - `comment_pinned` - Comment was pinned
     - `comment_unpinned` - Comment was unpinned

## UI Components

### 1. UserActionModal
- Modal with action buttons
- Timeout duration picker with quick select
- Loading states
- Permission checks

### 2. StreamDashboardScreen
- Two sections: Moderators and Banned Users
- Search functionality for adding moderators
- Avatar display for all users
- Empty states with helpful messages

### 3. ModeratorControlPanel
- Tabbed interface (Moderators / Banned)
- Search functionality
- Real-time data updates
- Accessible during livestream

### 4. ModeratorChatOverlay
- Replaces EnhancedChatOverlay for streamers
- Shows pinned comments prominently
- Moderator action buttons on each message
- Long press to open user actions
- Badge display for moderators/fans

## Integration Points

### BroadcasterScreen Updates:
1. Added moderator panel toggle button (shield icon)
2. Replaced EnhancedChatOverlay with ModeratorChatOverlay
3. Updated ViewerListModal to support user actions
4. Added ModeratorControlPanel modal

### AccountSettingsScreen Updates:
1. Added "Stream Dashboard" menu item
2. Links to StreamDashboardScreen

## Security & Permissions

### Row Level Security (RLS):
- All tables have RLS enabled
- Policies ensure users can only manage their own data
- Moderators can only act within their assigned streamer's streams

### Permission Checks:
- Frontend checks for streamer/moderator status
- Backend enforces permissions via RLS policies
- Actions are validated before execution

## Testing Checklist

- [ ] Add moderator from Stream Dashboard
- [ ] Add moderator during livestream
- [ ] Remove moderator
- [ ] Ban user from chat
- [ ] Ban user from viewer list
- [ ] Unban user
- [ ] Timeout user (various durations)
- [ ] Remove comment
- [ ] Pin comment (various durations)
- [ ] Like comment
- [ ] View pinned comment
- [ ] Check moderator limit (30 max)
- [ ] Verify ban persists across streams
- [ ] Verify timeout expires automatically
- [ ] Verify pin expires automatically
- [ ] Test real-time updates
- [ ] Test permission checks

## Future Enhancements

Potential improvements:
1. Moderator activity logs
2. Auto-moderation rules (spam detection, profanity filter)
3. Moderator levels with different permissions
4. Ban duration options (temporary bans)
5. Appeal system for banned users
6. Moderator statistics and leaderboards
7. Bulk moderation actions
8. Export moderation logs

## Notes

- ✅ Does NOT modify streaming API logic
- ✅ Does NOT modify tokens or Cloudflare functions
- ✅ Does NOT interfere with start/stop streaming
- ✅ All moderation features work independently of streaming logic
- ✅ Real-time updates ensure all viewers see moderation actions
- ✅ Database constraints prevent abuse (max 30 moderators, etc.)
