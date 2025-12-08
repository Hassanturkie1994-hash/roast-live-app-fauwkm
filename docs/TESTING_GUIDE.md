
# Livestreaming Feature - Testing Guide

## Prerequisites

Before testing, ensure:

1. ✅ Edge functions are deployed and working
2. ✅ Environment variables are set in Supabase
3. ✅ Database tables exist with RLS policies
4. ✅ User is authenticated in the app

## Test Scenarios

### 1. Broadcaster - Start Stream

**Steps**:
1. Navigate to broadcaster screen (tab bar → Go Live)
2. Tap "GO LIVE" button
3. Enter stream title: "Test Stream"
4. Tap "GO LIVE" in modal

**Expected Results**:
- ✅ Modal closes
- ✅ Camera preview shows
- ✅ LIVE badge appears (top left)
- ✅ Viewer count shows "0" (top right)
- ✅ Timer starts at 00:00:00
- ✅ Chat overlay appears (left side)
- ✅ Watermark visible (bottom right)
- ✅ Alert: "🔴 You are LIVE!"

**Check Database**:
```sql
SELECT * FROM streams WHERE status = 'live' ORDER BY created_at DESC LIMIT 1;
```

Should show:
- title: "Test Stream"
- status: "live"
- playback_url: (HLS URL)
- ingest_url: (RTMP URL)
- started_at: (current timestamp)

### 2. Viewer - Watch Stream

**Steps**:
1. Copy stream ID from database
2. Navigate to: `/live-player?streamId=<stream_id>`
3. Wait for video to load

**Expected Results**:
- ✅ Loading indicator appears
- ✅ Video player loads
- ✅ LIVE badge visible (top center)
- ✅ Viewer count shows "1" (top center)
- ✅ Close button (top left)
- ✅ Broadcaster name (bottom left)
- ✅ Stream title (bottom left)
- ✅ Follow button (bottom right)
- ✅ Like/Share buttons (right side)
- ✅ Chat toggle button (bottom left)

**Check Console**:
```
Player status: loading
Player status: readyToPlay
Viewer joined
```

### 3. Real-time Viewer Count

**Steps**:
1. Open broadcaster screen in one browser tab
2. Open viewer screen in 2-3 other tabs
3. Watch viewer count update

**Expected Results**:
- ✅ Broadcaster sees count increase: 0 → 1 → 2 → 3
- ✅ All viewers see same count
- ✅ Count updates within 1-2 seconds
- ✅ Close a viewer tab → count decreases

**Check Console** (broadcaster):
```
Viewer count update: { count: 1 }
Viewer count update: { count: 2 }
Viewer count update: { count: 3 }
```

### 4. Chat - Send Messages

**Steps**:
1. In viewer screen, tap "Show Chat"
2. Type message: "Hello from viewer!"
3. Tap send button
4. Check broadcaster screen

**Expected Results**:
- ✅ Message appears in viewer chat
- ✅ Message appears in broadcaster chat overlay
- ✅ Username shows in gradient color
- ✅ Message text is white
- ✅ Timestamp is correct
- ✅ Smooth fade-in animation

**Check Database**:
```sql
SELECT * FROM chat_messages WHERE stream_id = '<stream_id>' ORDER BY created_at DESC;
```

### 5. Chat - Multiple Messages

**Steps**:
1. Send 5-10 messages rapidly
2. Scroll chat if needed

**Expected Results**:
- ✅ All messages appear
- ✅ Messages in correct order
- ✅ No duplicates
- ✅ Auto-scroll to bottom
- ✅ Smooth animations

### 6. Broadcaster - End Stream

**Steps**:
1. In broadcaster screen, tap "END STREAM"
2. Confirm in alert dialog

**Expected Results**:
- ✅ Alert: "Stream Ended"
- ✅ LIVE badge disappears
- ✅ Timer stops
- ✅ Viewer count resets to 0
- ✅ Chat overlay disappears
- ✅ Camera preview remains

**Check Database**:
```sql
SELECT * FROM streams WHERE id = '<stream_id>';
```

Should show:
- status: "ended"
- ended_at: (current timestamp)

### 7. Viewer - Stream Ended

**Steps**:
1. Keep viewer screen open
2. Broadcaster ends stream
3. Observe viewer screen

**Expected Results**:
- ✅ Video stops playing
- ✅ Error message may appear
- ✅ Viewer can close screen

### 8. Follow/Unfollow

**Steps**:
1. In viewer screen, tap "Follow" button
2. Tap again to unfollow

**Expected Results**:
- ✅ Button changes: "Follow" → "Following"
- ✅ Button color changes
- ✅ Notification created in database
- ✅ Unfollow works correctly

**Check Database**:
```sql
SELECT * FROM followers WHERE follower_id = '<viewer_id>' AND following_id = '<broadcaster_id>';
```

### 9. Like Stream

**Steps**:
1. In viewer screen, tap heart icon
2. Check for feedback

**Expected Results**:
- ✅ Alert: "❤️ Like sent!"
- ✅ Broadcast event sent
- ✅ No errors in console

### 10. Share Stream

**Steps**:
1. In viewer screen, tap share icon
2. Check alert dialog

**Expected Results**:
- ✅ Alert shows stream info
- ✅ Options: "Copy Link", "Cancel"
- ✅ Stream title and broadcaster name visible

## WebRTC Testing (Web Only)

### Test WebRTC Streaming

**Steps**:
1. Open broadcaster screen in Chrome/Firefox
2. Start stream
3. Open browser console
4. Check for WebRTC logs

**Expected Results**:
- ✅ Console: "Initializing WebRTC stream"
- ✅ Console: "WebRTC streaming started successfully"
- ✅ No WebRTC errors
- ✅ Connection state: "connected"

**Check Network Tab**:
- ✅ POST request to rtc_publish_url
- ✅ Response: 200 OK
- ✅ SDP answer received

### Test Camera/Microphone Access

**Steps**:
1. Start stream
2. Browser prompts for permissions
3. Allow camera and microphone

**Expected Results**:
- ✅ Permission prompt appears
- ✅ Camera preview shows
- ✅ Microphone indicator active
- ✅ No permission errors

## Error Scenarios

### 1. No Stream Title

**Steps**:
1. Tap "GO LIVE"
2. Leave title empty
3. Tap "GO LIVE" in modal

**Expected**:
- ✅ Alert: "Please enter a stream title"
- ✅ Modal stays open

### 2. Not Authenticated

**Steps**:
1. Sign out
2. Try to start stream

**Expected**:
- ✅ Redirect to login screen
- ✅ Or alert: "You must be logged in"

### 3. Stream Not Found

**Steps**:
1. Navigate to `/live-player?streamId=invalid-id`

**Expected**:
- ✅ Alert: "Stream not found"
- ✅ Redirect back

### 4. No Playback URL

**Steps**:
1. Create stream but don't start broadcasting
2. Try to view

**Expected**:
- ✅ Error screen: "Stream not available"
- ✅ Message: "Broadcaster hasn't started streaming yet"
- ✅ "Go Back" button

### 5. Network Error

**Steps**:
1. Disconnect internet
2. Try to start stream

**Expected**:
- ✅ Alert: "Failed to start stream"
- ✅ Error logged to console
- ✅ Loading state ends

## Performance Testing

### 1. Multiple Viewers

**Test**: 10+ concurrent viewers

**Expected**:
- ✅ All viewers see stream
- ✅ Viewer count accurate
- ✅ Chat works for all
- ✅ No lag or freezing

### 2. Long Stream Duration

**Test**: Stream for 30+ minutes

**Expected**:
- ✅ Timer accurate
- ✅ No memory leaks
- ✅ Chat continues working
- ✅ Viewer count stable

### 3. Rapid Chat Messages

**Test**: Send 50+ messages quickly

**Expected**:
- ✅ All messages delivered
- ✅ No duplicates
- ✅ Correct order
- ✅ UI remains responsive

## Mobile Testing (iOS/Android)

### Camera Permissions

**Steps**:
1. First time opening broadcaster screen
2. System prompts for camera permission

**Expected**:
- ✅ Permission prompt appears
- ✅ Granting permission shows camera
- ✅ Denying shows permission screen

### Camera Flip

**Steps**:
1. Start stream
2. Tap camera flip button

**Expected**:
- ✅ Camera switches front/back
- ✅ No interruption to stream
- ✅ Smooth transition

### Microphone Toggle

**Steps**:
1. Start stream
2. Tap mic button

**Expected**:
- ✅ Button shows muted state
- ✅ Icon changes
- ✅ Background color changes

## Debugging

### Check Logs

**Broadcaster Console**:
```
Starting live stream: { title: "...", userId: "..." }
Live stream started successfully: { stream: {...}, ... }
WebRTC streaming started successfully
Viewer count update: { count: 1 }
```

**Viewer Console**:
```
Stream data: { id: "...", title: "...", ... }
Player status: loading
Player status: readyToPlay
Viewer joined
New chat message: { message: "...", ... }
```

### Check Network Requests

**Start Stream**:
- POST to `/functions/v1/start-live`
- Status: 200
- Response includes: stream, ingest_url, playback_url, rtc_publish_url

**Stop Stream**:
- POST to `/functions/v1/stop-live`
- Status: 200
- Response includes: stream with status "ended"

### Check Database

**Active Streams**:
```sql
SELECT id, title, status, viewer_count, started_at 
FROM streams 
WHERE status = 'live' 
ORDER BY started_at DESC;
```

**Recent Messages**:
```sql
SELECT cm.message, u.display_name, cm.created_at
FROM chat_messages cm
JOIN users u ON cm.user_id = u.id
WHERE cm.stream_id = '<stream_id>'
ORDER BY cm.created_at DESC
LIMIT 20;
```

**Followers**:
```sql
SELECT f.*, u1.display_name as follower, u2.display_name as following
FROM followers f
JOIN users u1 ON f.follower_id = u1.id
JOIN users u2 ON f.following_id = u2.id
ORDER BY f.created_at DESC;
```

## Success Criteria

✅ **Broadcaster can**:
- Start stream with title
- See live stats (viewers, time)
- Read chat messages
- End stream cleanly

✅ **Viewer can**:
- Watch HLS stream
- See viewer count
- Send chat messages
- Follow broadcaster
- Like and share

✅ **Real-time works**:
- Viewer count updates instantly
- Chat messages appear immediately
- No lag or delays

✅ **Database correct**:
- Streams saved properly
- Status updates correctly
- Chat messages stored
- Followers tracked

✅ **UI/UX smooth**:
- No crashes
- Smooth animations
- Responsive controls
- Clear feedback

## Common Issues

### Issue: "Failed to start stream"
**Solution**: Check edge function logs, verify Cloudflare credentials

### Issue: Video won't play
**Solution**: Check playback_url exists, verify HLS format, check CORS

### Issue: Viewer count stuck at 0
**Solution**: Check Supabase Realtime enabled, verify channel subscription

### Issue: Chat messages not appearing
**Solution**: Check broadcast channel, verify database insert, check RLS policies

### Issue: WebRTC not working
**Solution**: Check browser support, verify rtc_publish_url, check WHIP protocol

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected vs actual behavior
3. Console logs
4. Network requests
5. Database state
6. Platform (web/iOS/Android)
7. Browser/device info
