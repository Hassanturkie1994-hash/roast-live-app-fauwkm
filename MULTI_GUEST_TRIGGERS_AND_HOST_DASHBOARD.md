
# Multi-Guest Livestream Triggers & Host Control Dashboard

## Overview

This implementation adds database triggers to enforce multi-guest seat rules and creates a floating Host Control Dashboard for managing livestream guests, seats, and moderation.

## Database Triggers

### 1. Trigger: Prevent More Than 9 Active Guests

**Function:** `check_max_guests()`

**Purpose:** Ensures that no more than 9 guests can be active in a stream at any given time.

**Logic:**
- Counts active guests (where `user_id IS NOT NULL` and `left_at IS NULL`)
- Raises an exception if attempting to add a 10th guest
- Only checks on INSERT or UPDATE operations that would create an active seat

**SQL:**
```sql
CREATE OR REPLACE FUNCTION check_max_guests()
RETURNS TRIGGER AS $$
DECLARE
  active_guests INTEGER;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.user_id IS NOT NULL AND NEW.left_at IS NULL) OR
     (TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL AND NEW.left_at IS NULL AND OLD.left_at IS NOT NULL) THEN
    
    SELECT COUNT(*) INTO active_guests
    FROM stream_guest_seats
    WHERE stream_id = NEW.stream_id
      AND user_id IS NOT NULL
      AND left_at IS NULL
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF active_guests >= 9 THEN
      RAISE EXCEPTION 'Max guests reached. Only 9 guests are allowed per stream.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 2. Trigger: Unique Seat Index Per Stream

**Function:** `check_unique_seat_index()`

**Purpose:** Prevents two active guests from occupying the same seat index in a stream.

**Logic:**
- Checks if another active seat exists with the same `stream_id` and `seat_index`
- Only enforces uniqueness for active seats (`left_at IS NULL`)
- Allows historical seats to have duplicate indices

**SQL:**
```sql
CREATE OR REPLACE FUNCTION check_unique_seat_index()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM stream_guest_seats
      WHERE stream_id = NEW.stream_id
        AND seat_index = NEW.seat_index
        AND left_at IS NULL
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      RAISE EXCEPTION 'Seat index % is already taken in this stream', NEW.seat_index;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3. Trigger: Auto-Clear Moderator on Seat Leave

**Function:** `clear_moderator_on_seat_leave()`

**Purpose:** Automatically revokes moderator status when a guest leaves their seat.

**Logic:**
- Triggers when `left_at` is set (guest leaves)
- Updates `stream_permissions` table to set `is_moderator = false` and `removed_at = NOW()`
- Only affects active moderator permissions

**SQL:**
```sql
CREATE OR REPLACE FUNCTION clear_moderator_on_seat_leave()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NOT NULL AND (OLD.left_at IS NULL OR OLD.left_at IS DISTINCT FROM NEW.left_at) THEN
    UPDATE stream_permissions
    SET is_moderator = false,
        removed_at = NEW.left_at,
        updated_at = NOW()
    WHERE stream_id = NEW.stream_id
      AND user_id = NEW.user_id
      AND is_moderator = true
      AND removed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4. Trigger: Stream End Cleanup

**Function:** `stream_end_cleanup()`

**Purpose:** Automatically cleans up all guest seats and permissions when a stream ends.

**Logic:**
- Triggers when `ended_at` is set on `live_streams` or `streams` table
- Sets `left_at` for all active guest seats
- Sets `removed_at` and `is_moderator = false` for all active permissions

**SQL:**
```sql
CREATE OR REPLACE FUNCTION stream_end_cleanup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    UPDATE stream_guest_seats
    SET left_at = NEW.ended_at,
        updated_at = NOW()
    WHERE stream_id = NEW.id
      AND left_at IS NULL;

    UPDATE stream_permissions
    SET removed_at = NEW.ended_at,
        is_moderator = false,
        updated_at = NOW()
    WHERE stream_id = NEW.id
      AND removed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Stream Permissions Table

A new table `stream_permissions` has been created to track moderator status separately from guest seats:

```sql
CREATE TABLE stream_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_moderator BOOLEAN NOT NULL DEFAULT false,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- Users can view permissions for streams they're in
- Stream hosts can manage all permissions

## Host Control Dashboard

### Features

The Host Control Dashboard is a draggable floating panel that provides comprehensive control over the livestream:

#### Section 1: Active Guest Seats

- **Display:** Shows all active guests (up to 9) with:
  - Avatar
  - Display name
  - Seat number
  - Moderator badge (if applicable)

- **Actions per guest:**
  - **Remove Guest:** Kicks the guest from the stream
  - **Mute/Unmute Mic:** Controls guest's microphone
  - **Disable/Enable Camera:** Controls guest's camera
  - **Assign/Revoke Moderator:** Grants or removes moderator status

#### Section 2: Seat Management

- **Visual Grid:** Shows all 9 seats (0-8) with their current state:
  - **Occupied:** Shows guest avatar and name
  - **Empty:** Shows "Seat available" with invite option
  - **Locked:** Shows "Locked slot" when seats are locked

- **Controls:**
  - **Lock All Seats:** Prevents new guests from joining
  - **Unlock All Seats:** Allows new guests to join

#### Section 3: Live Access Rules

Toggle switches for:
- **Followers-only join:** Only followers can accept invitations
- **Verified-only join:** Only verified users can join
- **Allow moderators to invite guests:** Moderators can send invitations

*Note: These are UI-only toggles and don't affect the streaming API*

#### Section 4: Session Admin Tools

- **Show Banned Users:** Opens modal with list of banned users
  - View ban reason
  - Unban users
  
- **Show Timeout List:** Opens modal with timed-out users
  - View timeout duration
  - Remove timeout early
  
- **Clear Timeouts:** Removes all active timeouts
  
- **Revoke All Moderators:** Removes moderator status from all guests

### UI/UX Features

- **Draggable:** Panel can be moved anywhere on screen
- **Z-Index:** Always appears above camera feed and overlays
- **Responsive:** Adapts to different screen sizes
- **Animated:** Smooth transitions and animations
- **Accessible:** Clear visual feedback for all actions

### Integration

The dashboard is integrated into `BroadcasterScreen.tsx`:

```typescript
// State
const [showHostControlDashboard, setShowHostControlDashboard] = useState(false);

// Button to open dashboard
<HostControlButton onPress={() => setShowHostControlDashboard(true)} />

// Dashboard component
<HostControlDashboard
  streamId={currentStream.id}
  hostId={user.id}
  visible={showHostControlDashboard}
  onClose={() => setShowHostControlDashboard(false)}
/>
```

## Components

### 1. HostControlDashboard.tsx

Main dashboard component with all sections and modals.

**Props:**
- `streamId: string` - Current stream ID
- `hostId: string` - Host user ID
- `visible: boolean` - Controls visibility
- `onClose: () => void` - Close callback

### 2. HostControlButton.tsx

Floating button to toggle the dashboard.

**Props:**
- `onPress: () => void` - Press callback

## Service Integration

The dashboard uses `streamGuestService` for all guest management operations:

- `getActiveGuestSeats(streamId)` - Fetch active guests
- `removeGuest(streamId, userId, hostId)` - Remove a guest
- `updateMicStatus(streamId, userId, enabled)` - Control mic
- `updateCameraStatus(streamId, userId, enabled)` - Control camera
- `toggleModeratorStatus(streamId, userId, hostId, isModerator)` - Manage moderator status
- `toggleSeatsLock(streamId, hostId, locked)` - Lock/unlock seats

## Realtime Updates

The dashboard subscribes to realtime changes:

```typescript
const channel = streamGuestService.subscribeToGuestSeats(streamId, () => {
  loadData();
});
```

This ensures the UI updates immediately when:
- Guests join or leave
- Moderator status changes
- Seats are locked/unlocked

## Testing

### Test Scenarios

1. **Max Guests Enforcement:**
   - Try to add a 10th guest → Should fail with error
   - Remove a guest and add another → Should succeed

2. **Seat Index Uniqueness:**
   - Try to assign two guests to same seat → Should fail
   - Assign guests to different seats → Should succeed

3. **Moderator Auto-Revoke:**
   - Assign moderator to guest
   - Remove guest from seat
   - Check `stream_permissions` → Should show `is_moderator = false`

4. **Stream End Cleanup:**
   - End stream with active guests
   - Check `stream_guest_seats` → All should have `left_at` set
   - Check `stream_permissions` → All should have `removed_at` set

5. **Host Control Dashboard:**
   - Open dashboard during live stream
   - Test all guest actions (remove, mute, camera, moderator)
   - Test seat locking
   - Test admin tools (ban list, timeout list)
   - Verify realtime updates

## Error Handling

All database triggers raise exceptions with clear error messages:

- `"Max guests reached. Only 9 guests are allowed per stream."`
- `"Seat index X is already taken in this stream"`

The UI handles these errors gracefully and displays user-friendly messages.

## Performance Considerations

- **Indexes:** Created on frequently queried columns:
  - `stream_permissions(stream_id)`
  - `stream_permissions(user_id)`
  - `stream_permissions(stream_id, user_id) WHERE removed_at IS NULL`

- **Efficient Queries:** Triggers use indexed columns for fast lookups
- **Minimal Overhead:** Triggers only execute on relevant operations

## Security

- **RLS Policies:** Ensure only authorized users can view/modify permissions
- **Host Verification:** All service functions verify the user is the stream host
- **No Streaming API Impact:** All operations are database-only and don't affect Cloudflare streaming

## Future Enhancements

Potential improvements:

1. **Seat Swapping:** Allow host to move guests between seats
2. **Guest Permissions:** Fine-grained control over guest capabilities
3. **Invitation History:** Track all invitations sent/received
4. **Analytics:** Track guest participation metrics
5. **Automated Moderation:** AI-powered guest behavior monitoring

## Conclusion

This implementation provides a robust, scalable system for managing multi-guest livestreams with comprehensive host controls. The database triggers ensure data consistency, while the Host Control Dashboard provides an intuitive interface for real-time stream management.
