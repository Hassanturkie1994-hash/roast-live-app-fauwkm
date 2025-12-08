
# Roast Live - Livestreaming Implementation Guide

## Overview

This document describes the complete TikTok-like livestreaming implementation for Roast Live, including on-device streaming, real-time chat, and viewer tracking.

## Architecture

### Backend (Supabase Edge Functions)

#### 1. start-live Function
- **Endpoint**: `POST /functions/v1/start-live`
- **Purpose**: Creates a new Cloudflare Stream live input and stores metadata
- **Input**:
  ```json
  {
    "title": "Stream title",
    "broadcaster_id": "user-uuid"
  }
  ```
- **Output**:
  ```json
  {
    "success": true,
    "stream": {
      "id": "stream-uuid",
      "broadcaster_id": "user-uuid",
      "title": "Stream title",
      "cloudflare_stream_id": "cf-stream-id",
      "ingest_url": "rtmps://live.cloudflare.com/live",
      "stream_key": "unique-key",
      "playback_url": "https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8",
      "status": "live",
      "viewer_count": 0,
      "started_at": "2025-01-01T00:00:00Z"
    },
    "ingest_url": "rtmps://live.cloudflare.com/live",
    "stream_key": "unique-key",
    "playback_url": "https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8"
  }
  ```

#### 2. stop-live Function
- **Endpoint**: `POST /functions/v1/stop-live`
- **Purpose**: Ends the live stream and updates status
- **Input**:
  ```json
  {
    "stream_id": "stream-uuid"
  }
  ```
- **Output**:
  ```json
  {
    "success": true,
    "stream": {
      "id": "stream-uuid",
      "status": "ended",
      "ended_at": "2025-01-01T01:00:00Z"
    }
  }
  ```

### Frontend Components

#### 1. Broadcaster Screen (`app/(tabs)/broadcaster.tsx`)

**Features**:
- Camera preview with front/back toggle
- Live status indicators (LIVE badge, timer, viewer count)
- Mic and camera controls
- Stream setup modal
- Automatic RTMP streaming (native builds)
- Real-time chat overlay
- Watermark overlay

**Native Streaming**:
- Uses `react-native-nodemediaclient` for on-device RTMP streaming
- Automatically encodes video (H.264) and audio (AAC)
- Streams directly to Cloudflare without exposing credentials to user
- Fallback to OBS instructions for web/Expo Go

**Configuration**:
```typescript
// Video settings
width: 720
height: 1280
fps: 30
bitrate: 2000 kbps (2 Mbps)
codec: H.264 Baseline

// Audio settings
bitrate: 128 kbps
codec: AAC LC
samplerate: 44100 Hz
```

#### 2. Live Player Screen (`app/live-player.tsx`)

**Features**:
- HLS video playback with adaptive bitrate
- Live badge and viewer count
- Real-time chat overlay
- Follow button
- Like and share actions
- Broadcaster info display
- Watermark overlay

**Viewer Tracking**:
- Uses Supabase Realtime Presence to track active viewers
- Automatically updates viewer count
- Broadcasts count to broadcaster

#### 3. Chat Overlay Component (`components/ChatOverlay.tsx`)

**Features**:
- Real-time message delivery using Supabase Realtime broadcast
- Expandable/collapsible for viewers
- Compact view for broadcasters
- Smooth animations for new messages
- Auto-scroll to latest messages

**Implementation**:
- Uses Supabase Realtime `broadcast` instead of `postgres_changes` for better scalability
- Messages stored in `chat_messages` table for history
- Supports thousands of concurrent viewers

## Database Schema

### streams Table
```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id UUID REFERENCES users(id),
  cloudflare_stream_id TEXT,
  playback_url TEXT,
  ingest_url TEXT,
  stream_key TEXT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'ended' CHECK (status IN ('live', 'ended')),
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view live streams"
  ON streams FOR SELECT
  USING (status = 'live');

CREATE POLICY "Broadcasters can manage their streams"
  ON streams FOR ALL
  USING (broadcaster_id = auth.uid());
```

### chat_messages Table
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id),
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view chat messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Real-time Features

### 1. Chat System
- **Channel**: `stream:{streamId}:chat`
- **Event**: `message`
- **Payload**: Complete chat message with user data
- **Scalability**: Uses broadcast for unlimited concurrent viewers

### 2. Viewer Tracking
- **Channel**: `stream:{streamId}:viewers`
- **Method**: Presence tracking
- **Updates**: Real-time viewer count
- **Broadcast**: Count sent to broadcaster channel

### 3. Broadcaster Updates
- **Channel**: `stream:{streamId}:broadcaster`
- **Event**: `viewer_count`
- **Payload**: Current viewer count
- **Purpose**: Update broadcaster UI

## Security

### RTMP Credentials
- ✅ **NEVER** exposed in frontend UI
- ✅ Stored server-side in Supabase `streams` table
- ✅ Only accessible via authenticated Edge Functions
- ✅ Automatically used by native streaming library
- ✅ RLS policies prevent unauthorized access

### User Authentication
- All streaming actions require authenticated user
- Edge Functions verify JWT tokens
- RLS policies enforce data access rules

## Cloudflare Stream Integration

### Live Input Creation
```typescript
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/live_inputs
Authorization: Bearer {api_token}

{
  "meta": {
    "name": "Stream title"
  },
  "recording": {
    "mode": "automatic",
    "timeoutSeconds": 0
  }
}
```

### Response
```json
{
  "result": {
    "uid": "cloudflare-stream-id",
    "rtmps": {
      "url": "rtmps://live.cloudflare.com/live",
      "streamKey": "unique-key"
    },
    "playback": {
      "hls": "https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8"
    }
  }
}
```

### Features
- Automatic transcoding to multiple qualities (240p - 1080p)
- Adaptive bitrate streaming (HLS)
- Global CDN delivery
- Automatic recording
- Low latency (~10-15 seconds)

## Environment Variables

Required in Supabase Edge Functions:

```bash
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Native Build Requirements

### iOS
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "We need camera access for live streaming",
        "NSMicrophoneUsageDescription": "We need microphone access for live streaming"
      }
    }
  }
}
```

### Android
```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "INTERNET"
      ]
    }
  }
}
```

## Limitations & Fallbacks

### Expo Go / Web
- Native RTMP streaming not available
- Falls back to showing RTMP credentials
- Users must use OBS or similar software
- Full functionality requires native build

### Production Native Builds
- Full on-device RTMP streaming
- No OBS required
- Automatic credential handling
- TikTok-like experience

## Performance Considerations

### Broadcaster
- Video encoding: Hardware-accelerated H.264
- Audio encoding: AAC LC
- Bitrate: 2 Mbps (adjustable based on network)
- Resolution: 720x1280 (portrait)
- FPS: 30

### Viewer
- HLS adaptive bitrate streaming
- Automatic quality switching
- CDN-delivered segments
- ~10-15 second latency

### Chat
- Broadcast-based (not postgres_changes)
- Scales to thousands of concurrent users
- Messages stored for history
- Real-time delivery

## Testing

### Test Broadcaster Flow
1. Login as user
2. Navigate to Broadcaster tab
3. Tap "GO LIVE"
4. Enter stream title
5. Tap "GO LIVE" in modal
6. Verify LIVE badge appears
7. Verify timer starts
8. Check chat functionality

### Test Viewer Flow
1. Login as different user
2. Navigate to Home tab
3. Find live stream
4. Tap to open player
5. Verify video plays
6. Check viewer count updates
7. Test chat messages
8. Test follow button

## Troubleshooting

### Video Not Playing
- Check playback_url is valid HLS URL
- Verify Cloudflare Stream is configured
- Check network connectivity
- Verify stream status is 'live'

### Chat Not Working
- Check Supabase Realtime is enabled
- Verify channel subscription
- Check RLS policies
- Verify user authentication

### Viewer Count Not Updating
- Check Presence tracking is working
- Verify channel subscriptions
- Check broadcast events
- Verify network connectivity

## Future Enhancements

1. **Reactions**: Animated emoji reactions
2. **Gifts**: Virtual gifts for streamers
3. **Moderation**: Chat moderation tools
4. **Analytics**: Stream analytics dashboard
5. **Clips**: Create clips from live streams
6. **Notifications**: Push notifications for followers
7. **Quality Selection**: Manual quality selection
8. **Picture-in-Picture**: PiP mode for viewers
9. **Screen Sharing**: Share screen during stream
10. **Multi-camera**: Switch between multiple cameras

## Support

For issues or questions:
- Check Cloudflare Stream documentation
- Review Supabase Realtime docs
- Check react-native-nodemediaclient docs
- Review this implementation guide
