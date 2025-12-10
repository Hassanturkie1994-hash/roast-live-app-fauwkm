
# Multi-Guest Livestream System - Complete Implementation

## Overview
This document describes the complete implementation of the multi-guest livestream invitation system for Roast Live, supporting up to 10 participants (1 host + 9 guests) with real-time invitation flow, database triggers, and dynamic UI layouts.

## Database Structure

### Tables

#### `stream_guest_seats`
Stores active and historical guest seat assignments.
- `id`: UUID primary key
- `stream_id`: Reference to streams table
- `user_id`: Reference to profiles table (nullable)
- `seat_index`: Integer (0-8) for consistent UI positioning
- `joined_at`: Timestamp when guest joined
- `left_at`: Timestamp when guest left (null = active)
- `is_moderator`: Boolean for temporary moderator status
- `mic_enabled`: Boolean for microphone state
- `camera_enabled`: Boolean for camera state
- `created_at`, `updated_at`: Timestamps

#### `stream_guest_invitations`
Tracks invitation lifecycle.
- `id`: UUID primary key
- `stream_id`: Reference to streams table
- `inviter_id`: Host user ID
- `invitee_id`: Invited user ID
- `seat_index`: Assigned seat index
- `status`: 'pending' | 'accepted' | 'declined' | 'expired'
- `created_at`: Invitation timestamp
- `expires_at`: Auto-set to 20 seconds from creation
- `responded_at`: When user responded

#### `stream_guest_events`
Logs all guest-related events for chat integration.
- `id`: UUID primary key
- `stream_id`: Reference to streams table
- `user_id`: User who triggered event
- `event_type`: Type of event (joined_live, left_live, muted_mic, etc.)
- `display_name`: User's display name
- `metadata`: JSONB for additional data
- `created_at`: Event timestamp

#### `streams` (updated)
Added `seats_locked` column:
- `seats_locked`: Boolean (default false) - prevents new invitations when true

## Database Triggers

### Trigger 1: Validate Seat Availability
**Function:** `validate_guest_seat_availability()`
**Trigger:** `BEFORE INSERT ON stream_guest_seats`

Enforces:
- User cannot have multiple active seats in same stream
- Seat index cannot be occupied by another active guest
- Maximum 9 active guests per stream

### Trigger 2: Auto-cleanup on Stream End
**Function:** `cleanup_guest_seats_on_stream_end()`
**Trigger:** `AFTER UPDATE ON streams`

When stream status changes from 'live' to 'ended':
- Sets `left_at = NOW()` for all active guest seats
- Ensures clean state for stream history

### Trigger 3: Broadcast Invitation Events
**Function:** `broadcast_guest_invitation()`
**Trigger:** `AFTER INSERT OR UPDATE ON stream_guest_invitations`

Broadcasts invitation changes via PostgreSQL NOTIFY for real-time updates.

### Trigger 4: Broadcast Seat Changes
**Function:** `broadcast_guest_seat_change()`
**Trigger:** `AFTER INSERT OR UPDATE OR DELETE ON stream_guest_seats`

Broadcasts seat changes to all stream viewers in real-time.

## Service Layer

### `streamGuestService.ts`

#### Core Methods

**Invitation Flow:**
- `inviteGuest(streamId, inviterId, inviteeId)` - Creates invitation with 20s expiration
- `acceptInvitation(invitationId, userId)` - Accepts and creates guest seat
- `declineInvitation(invitationId, userId)` - Declines invitation
- `getPendingInvitations(userId)` - Gets user's pending invitations

**Seat Management:**
- `getGuestSeats(streamId)` - Gets all seats for stream
- `getActiveGuestSeats(streamId)` - Gets only active seats
- `findAvailableSeatIndex(streamId)` - Finds first available seat (0-8)
- `leaveGuestSeat(streamId, userId)` - Guest voluntarily leaves
- `removeGuest(streamId, userId, hostId)` - Host removes guest
- `endAllGuestSessions(streamId)` - Ends all sessions when stream ends

**Guest Controls:**
- `updateMicStatus(streamId, userId, micEnabled)` - Toggle microphone
- `updateCameraStatus(streamId, userId, cameraEnabled)` - Toggle camera
- `toggleModeratorStatus(streamId, userId, hostId, isModerator)` - Grant/revoke moderator

**Host Controls:**
- `toggleSeatsLock(streamId, hostId, locked)` - Lock/unlock seats
- `swapSeats(streamId, hostId, seatIndex1, seatIndex2)` - Swap seat positions

**Events & Logging:**
- `logGuestEvent(streamId, userId, eventType, displayName, metadata)` - Log events
- `getGuestEvents(streamId, limit)` - Get recent events

**Real-time Subscriptions:**
- `subscribeToGuestSeats(streamId, callback)` - Subscribe to seat changes
- `subscribeToGuestEvents(streamId, callback)` - Subscribe to guest events
- `subscribeToInvitations(userId, callback)` - Subscribe to user's invitations

## UI Components

### 1. `GuestInvitationModal.tsx`
**Purpose:** Host sends invitation to viewer

**Features:**
- Shows invitee name
- "Send Invite" and "Cancel" buttons
- Info box explaining guest will appear on camera
- Loading state during invitation send
- Error handling for locked seats or full capacity

**Usage:**
```tsx
<GuestInvitationModal
  visible={showInviteModal}
  onClose={() => setShowInviteModal(false)}
  streamId={streamId}
  hostId={hostId}
  inviteeId={selectedViewerId}
  inviteeName={selectedViewerName}
/>
```

### 2. `GuestInvitationReceivedModal.tsx`
**Purpose:** Viewer receives and responds to invitation

**Features:**
- 20-second countdown timer (urgent styling at 5s)
- Host name display
- Warning about appearing on camera
- Preview toggle (shows camera preview placeholder)
- "Join Now" and "Decline" buttons
- Auto-decline after 20 seconds
- Success banner on acceptance

**Usage:**
```tsx
<GuestInvitationReceivedModal
  visible={showReceivedModal}
  onClose={() => setShowReceivedModal(false)}
  invitation={pendingInvitation}
  hostName={hostName}
  onAccept={handleAccept}
  onDecline={handleDecline}
/>
```

### 3. `GuestSeatGrid.tsx`
**Purpose:** Dynamic grid layout for all participants

**Features:**
- Adaptive layouts:
  - 1 participant: Fullscreen
  - 2 participants: Split view (host top)
  - 3-4 participants: 2x2 grid
  - 5-6 participants: 2x3 grid
  - 7-9 participants: 3x3 grid
- Host always top-left with thicker border
- "LIVE HOST" badge on host tile
- Profile picture display
- Display name
- Mic/camera status icons
- Moderator badge (when applicable)
- Auto-dim when camera disabled
- Fade-in/scale-up animation on join
- Long-press gesture for action menus
- Empty seat placeholders (host only)

**Usage:**
```tsx
<GuestSeatGrid
  hostName={hostName}
  hostAvatarUrl={hostAvatarUrl}
  guests={guestSeats}
  isHost={isHost}
  onGuestLongPress={handleGuestLongPress}
  onHostLongPress={handleHostLongPress}
  onEmptySeatPress={handleInviteGuest}
/>
```

### 4. `GuestControlPanel.tsx`
**Purpose:** Host controls for managing guests

**Features:**
- Seat counter (X/9 filled, Y available)
- Lock/Unlock seats button
- Invite guest button (disabled when locked/full)
- Guest list with:
  - Display name
  - Mic/camera status
  - Moderator badge
  - Toggle moderator button
  - Remove guest button
- Empty state when no guests

**Usage:**
```tsx
<GuestControlPanel
  guests={guestSeats}
  onRemoveGuest={handleRemoveGuest}
  onToggleModerator={handleToggleModerator}
  onSwapSeats={handleSwapSeats}
  onInviteGuest={handleInviteGuest}
  seatsLocked={seatsLocked}
  onToggleSeatsLock={handleToggleSeatsLock}
/>
```

### 5. `GuestSelfControls.tsx`
**Purpose:** Guest controls their own mic/camera

**Features:**
- Mute/Unmute mic button
- Enable/Disable camera button
- Leave seat button
- Visual feedback for on/off states

**Usage:**
```tsx
<GuestSelfControls
  micEnabled={micEnabled}
  cameraEnabled={cameraEnabled}
  onToggleMic={handleToggleMic}
  onToggleCamera={handleToggleCamera}
  onLeaveSeat={handleLeaveSeat}
/>
```

### 6. `GuestActionMenuModal.tsx`
**Purpose:** Host long-press menu for guest actions

**Features:**
- Bottom sheet modal
- Actions:
  - View Profile
  - Make/Remove Moderator
  - Move Seat
  - Remove Guest
- Color-coded actions (remove is red)
- Cancel button

**Usage:**
```tsx
<GuestActionMenuModal
  visible={showActionMenu}
  onClose={() => setShowActionMenu(false)}
  guest={selectedGuest}
  onRemoveGuest={handleRemoveGuest}
  onToggleModerator={handleToggleModerator}
  onMoveSeat={handleMoveSeat}
  onViewProfile={handleViewProfile}
/>
```

## Integration Guide

### For Broadcaster Screen

```tsx
import { streamGuestService } from '@/app/services/streamGuestService';
import GuestSeatGrid from '@/components/GuestSeatGrid';
import GuestControlPanel from '@/components/GuestControlPanel';
import GuestInvitationModal from '@/components/GuestInvitationModal';
import GuestActionMenuModal from '@/components/GuestActionMenuModal';

// State
const [guestSeats, setGuestSeats] = useState<StreamGuestSeat[]>([]);
const [seatsLocked, setSeatsLocked] = useState(false);
const [showInviteModal, setShowInviteModal] = useState(false);
const [selectedViewer, setSelectedViewer] = useState<any>(null);

// Subscribe to seat changes
useEffect(() => {
  if (!streamId) return;

  const channel = streamGuestService.subscribeToGuestSeats(streamId, (payload) => {
    console.log('Guest seat changed:', payload);
    loadGuestSeats();
  });

  loadGuestSeats();

  return () => {
    channel.unsubscribe();
  };
}, [streamId]);

// Load guest seats
const loadGuestSeats = async () => {
  const seats = await streamGuestService.getActiveGuestSeats(streamId);
  setGuestSeats(seats);
};

// Invite guest
const handleInviteGuest = (viewer: any) => {
  setSelectedViewer(viewer);
  setShowInviteModal(true);
};

// Remove guest
const handleRemoveGuest = async (userId: string) => {
  await streamGuestService.removeGuest(streamId, userId, currentUserId);
};

// Toggle moderator
const handleToggleModerator = async (userId: string, isModerator: boolean) => {
  await streamGuestService.toggleModeratorStatus(streamId, userId, currentUserId, isModerator);
};

// Toggle seats lock
const handleToggleSeatsLock = async () => {
  await streamGuestService.toggleSeatsLock(streamId, currentUserId, !seatsLocked);
  setSeatsLocked(!seatsLocked);
};

// Render
<View>
  <GuestSeatGrid
    hostName={currentUserName}
    hostAvatarUrl={currentUserAvatar}
    guests={guestSeats}
    isHost={true}
    onGuestLongPress={handleGuestLongPress}
    onEmptySeatPress={() => setShowInviteModal(true)}
  />
  
  <GuestControlPanel
    guests={guestSeats}
    onRemoveGuest={handleRemoveGuest}
    onToggleModerator={handleToggleModerator}
    onSwapSeats={handleSwapSeats}
    onInviteGuest={() => setShowInviteModal(true)}
    seatsLocked={seatsLocked}
    onToggleSeatsLock={handleToggleSeatsLock}
  />
  
  <GuestInvitationModal
    visible={showInviteModal}
    onClose={() => setShowInviteModal(false)}
    streamId={streamId}
    hostId={currentUserId}
    inviteeId={selectedViewer?.id}
    inviteeName={selectedViewer?.name}
  />
</View>
```

### For Viewer Screen

```tsx
import { streamGuestService } from '@/app/services/streamGuestService';
import GuestInvitationReceivedModal from '@/components/GuestInvitationReceivedModal';
import GuestSelfControls from '@/components/GuestSelfControls';

// State
const [pendingInvitation, setPendingInvitation] = useState<StreamGuestInvitation | null>(null);
const [isGuest, setIsGuest] = useState(false);
const [micEnabled, setMicEnabled] = useState(true);
const [cameraEnabled, setCameraEnabled] = useState(true);

// Subscribe to invitations
useEffect(() => {
  if (!currentUserId) return;

  const channel = streamGuestService.subscribeToInvitations(currentUserId, (payload) => {
    console.log('Invitation received:', payload);
    loadPendingInvitations();
  });

  loadPendingInvitations();

  return () => {
    channel.unsubscribe();
  };
}, [currentUserId]);

// Load pending invitations
const loadPendingInvitations = async () => {
  const invitations = await streamGuestService.getPendingInvitations(currentUserId);
  if (invitations.length > 0) {
    setPendingInvitation(invitations[0]);
  }
};

// Accept invitation
const handleAcceptInvitation = async () => {
  setIsGuest(true);
  setPendingInvitation(null);
};

// Decline invitation
const handleDeclineInvitation = async () => {
  setPendingInvitation(null);
};

// Toggle mic
const handleToggleMic = async () => {
  await streamGuestService.updateMicStatus(streamId, currentUserId, !micEnabled);
  setMicEnabled(!micEnabled);
};

// Toggle camera
const handleToggleCamera = async () => {
  await streamGuestService.updateCameraStatus(streamId, currentUserId, !cameraEnabled);
  setCameraEnabled(!cameraEnabled);
};

// Leave seat
const handleLeaveSeat = async () => {
  await streamGuestService.leaveGuestSeat(streamId, currentUserId);
  setIsGuest(false);
};

// Render
<View>
  <GuestInvitationReceivedModal
    visible={!!pendingInvitation}
    onClose={() => setPendingInvitation(null)}
    invitation={pendingInvitation}
    hostName={hostName}
    onAccept={handleAcceptInvitation}
    onDecline={handleDeclineInvitation}
  />
  
  {isGuest && (
    <GuestSelfControls
      micEnabled={micEnabled}
      cameraEnabled={cameraEnabled}
      onToggleMic={handleToggleMic}
      onToggleCamera={handleToggleCamera}
      onLeaveSeat={handleLeaveSeat}
    />
  )}
</View>
```

## Chat Integration

Guest events are automatically logged to `stream_guest_events` table. Integrate with chat by subscribing to these events:

```tsx
const channel = streamGuestService.subscribeToGuestEvents(streamId, (payload) => {
  const event = payload.new;
  
  // Display system message in chat
  const message = formatGuestEventMessage(event);
  addSystemMessageToChat(message);
});

function formatGuestEventMessage(event: GuestEvent): string {
  switch (event.event_type) {
    case 'joined_live':
      return `${event.display_name} joined live`;
    case 'left_live':
      return `${event.display_name} left live`;
    case 'muted_mic':
      return `${event.display_name} muted mic`;
    case 'unmuted_mic':
      return `${event.display_name} unmuted mic`;
    case 'enabled_camera':
      return `${event.display_name} enabled camera`;
    case 'disabled_camera':
      return `${event.display_name} disabled camera`;
    case 'host_removed':
      return `Host removed ${event.display_name}`;
    case 'became_moderator':
      return `${event.display_name} is now moderator`;
    case 'removed_moderator':
      return `${event.display_name} is no longer moderator`;
    case 'declined_invitation':
      return `${event.display_name} declined invitation`;
    default:
      return '';
  }
}
```

## Important Notes

### Constraints
1. **Maximum 9 guests** - Enforced by database trigger
2. **20-second invitation expiration** - Auto-decline if not responded
3. **Locked seats** - No invitations when `seats_locked = true`
4. **Host authorization** - Only stream owner can remove guests, toggle moderator, lock seats
5. **Seat persistence** - `seatIndex` remains static unless explicitly moved

### Best Practices
1. Always check `seats_locked` before showing invite button
2. Subscribe to real-time updates for responsive UI
3. Handle invitation expiration gracefully
4. Show loading states during async operations
5. Provide clear feedback for all actions
6. Log all guest events for chat integration

### Performance Considerations
1. Use `getActiveGuestSeats()` instead of `getGuestSeats()` when only active seats needed
2. Unsubscribe from channels when component unmounts
3. Batch seat updates when possible
4. Cache guest seat data and update via subscriptions

## Testing Checklist

- [ ] Host can invite viewer from viewer list
- [ ] Host can invite viewer from chat
- [ ] Viewer receives invitation modal immediately
- [ ] Invitation expires after 20 seconds
- [ ] Viewer can accept invitation
- [ ] Viewer can decline invitation
- [ ] Declined invitation sends system message to host
- [ ] Guest appears in correct seat index
- [ ] Guest can toggle mic on/off
- [ ] Guest can toggle camera on/off
- [ ] Guest can leave seat voluntarily
- [ ] Host can remove guest
- [ ] Host can make guest moderator
- [ ] Host can remove moderator status
- [ ] Host can lock/unlock seats
- [ ] Locked seats prevent new invitations
- [ ] Maximum 9 guests enforced
- [ ] All guest events appear in chat
- [ ] Seat grid adapts to participant count
- [ ] Animations work smoothly
- [ ] Long-press menus work correctly
- [ ] Stream end cleans up all guest seats

## Future Enhancements

1. **Seat swapping UI** - Drag-and-drop interface for rearranging seats
2. **Guest permissions** - Fine-grained control over what guests can do
3. **Guest spotlight** - Temporarily feature a specific guest
4. **Guest reactions** - Allow guests to send reactions
5. **Guest audio levels** - Visual indicator of who's speaking
6. **Guest bandwidth** - Adaptive quality based on connection
7. **Guest recording** - Option to record multi-guest sessions
8. **Guest analytics** - Track guest engagement metrics

## Support

For issues or questions:
1. Check database triggers are properly installed
2. Verify RLS policies allow necessary operations
3. Check real-time subscriptions are active
4. Review console logs for errors
5. Ensure Supabase project has sufficient resources

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
**Status:** Production Ready
