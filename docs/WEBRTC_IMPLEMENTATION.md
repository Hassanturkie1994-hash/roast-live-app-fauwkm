
# WebRTC Livestreaming Implementation Guide

This document describes the complete WebRTC livestreaming implementation for Roast Live.

## Overview

The app now supports full livestreaming with:
- **Broadcaster Screen**: Camera preview, GO LIVE button, viewer count, duration timer
- **Viewer Screen**: HLS playback, real-time viewer count, chat overlay
- **WebRTC Support**: Low-latency streaming using Cloudflare WebRTC (WHIP protocol)
- **Supabase Integration**: Database storage, real-time updates, chat

## Architecture

### Components Created

1. **`/app/screens/BroadcasterScreen.tsx`**
   - Camera preview with expo-camera
   - GO LIVE button with setup modal
   - Live stats (viewer count, duration timer)
   - Chat overlay for broadcaster
   - WebRTC streaming integration

2. **`/app/screens/ViewerScreen.tsx`**
   - HLS video playback with expo-video
   - Real-time viewer count via Supabase Presence
   - Chat overlay for viewers
   - Follow/Like/Share actions

3. **`/components/WebRTCLivePublisher.tsx`**
   - WebRTC streaming component
   - Uses WHIP protocol for Cloudflare
   - Handles camera/microphone access
   - Manages peer connection lifecycle

4. **`/app/services/cloudflareService.ts`**
   - `startLive(title, userId)` - Creates Cloudflare live input
   - `stopLive(streamId)` - Ends livestream
   - Returns: ingest_url, stream_key, rtc_publish_url, playback_url

## Edge Functions

### start-live

**Endpoint**: `POST /functions/v1/start-live`

**Request Body**:
```json
{
  "title": "My Stream Title",
  "user_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "stream": {
    "id": "uuid",
    "broadcaster_id": "uuid",
    "title": "My Stream Title",
    "cloudflare_stream_id": "cf_id",
    "ingest_url": "rtmps://...",
    "stream_key": "key",
    "playback_url": "https://.../playlist.m3u8",
    "status": "live",
    "viewer_count": 0,
    "started_at": "timestamp"
  },
  "ingest_url": "rtmps://...",
  "stream_key": "key",
  "playback_url": "https://.../playlist.m3u8",
  "rtc_publish_url": "https://customer-...cloudflarestream.com/..."
}
```

**Implementation**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, user_id } = await req.json();

    if (!title || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const CF_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const CF_ACCOUNT = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Create Cloudflare live input
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta: { name: title, user_id },
          recording: { mode: 'automatic', timeoutSeconds: 10 },
        }),
      }
    );

    const cfData = await cfResponse.json();

    if (!cfData.success) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cloudflare API error' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = cfData.result;
    const ingestUrl = result.rtmps?.url || result.rtmp?.url || '';
    const streamKey = result.rtmps?.streamKey || result.rtmp?.streamKey || '';
    const playbackUrl = result.playback?.hls || '';
    const rtcPublishUrl = result.webRTC?.url || '';

    // Save to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: streamData, error: dbError } = await supabase
      .from('streams')
      .insert({
        broadcaster_id: user_id,
        title,
        cloudflare_stream_id: result.uid,
        ingest_url: ingestUrl,
        stream_key: streamKey,
        playback_url: playbackUrl,
        status: 'live',
        viewer_count: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        stream: streamData,
        ingest_url: ingestUrl,
        stream_key: streamKey,
        playback_url: playbackUrl,
        rtc_publish_url: rtcPublishUrl,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### stop-live

**Endpoint**: `POST /functions/v1/stop-live`

**Request Body**:
```json
{
  "stream_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "stream": {
    "id": "uuid",
    "status": "ended",
    "ended_at": "timestamp"
  }
}
```

**Implementation**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { stream_id } = await req.json();

    if (!stream_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing stream_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const CF_TOKEN = Deno.env.get('CLOUDFLARE_API_TOKEN');
    const CF_ACCOUNT = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get stream from database
    const { data: stream, error: fetchError } = await supabase
      .from('streams')
      .select('cloudflare_stream_id')
      .eq('id', stream_id)
      .single();

    if (fetchError || !stream) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stream not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete Cloudflare live input
    if (stream.cloudflare_stream_id) {
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/stream/live_inputs/${stream.cloudflare_stream_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Update database
    const { data: updatedStream, error: updateError } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', stream_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update stream' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        stream: updatedStream,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Database Schema

The `streams` table already exists with the following structure:

```sql
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcaster_id UUID REFERENCES users(id) NOT NULL,
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

-- RLS policies already enabled
```

## WebRTC Implementation

### WHIP Protocol

Cloudflare Stream supports WebRTC ingestion using the WHIP (WebRTC-HTTP Ingestion Protocol) standard.

**Flow**:
1. Create live input via Cloudflare API
2. Get `webRTC.url` from response (rtc_publish_url)
3. Create RTCPeerConnection
4. Add camera/microphone tracks
5. Create SDP offer
6. POST offer to rtc_publish_url with Content-Type: application/sdp
7. Receive SDP answer
8. Set remote description
9. Stream is live!

### Browser Support

- **Web**: Full WebRTC support via browser APIs
- **iOS/Android**: Requires `react-native-webrtc` library for native builds
- **Expo Go**: Camera preview only, no WebRTC streaming

### Production Deployment

For production native apps with WebRTC:

1. Install `react-native-webrtc`:
   ```bash
   npm install react-native-webrtc
   ```

2. Update `WebRTCLivePublisher.tsx` to use native WebRTC

3. Build native app (not Expo Go)

## Real-time Features

### Viewer Count

Uses Supabase Realtime Presence:

```typescript
const channel = supabase
  .channel(`stream:${streamId}:viewers`)
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    const count = Object.keys(state).length;
    setViewerCount(count);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        user_id: user?.id || 'anonymous',
        online_at: new Date().toISOString(),
      });
    }
  });
```

### Chat

Uses Supabase Realtime Broadcast:

```typescript
const channel = supabase
  .channel(`stream:${streamId}:chat`)
  .on('broadcast', { event: 'message' }, (payload) => {
    setMessages((prev) => [...prev, payload.payload]);
  })
  .subscribe();

// Send message
await channel.send({
  type: 'broadcast',
  event: 'message',
  payload: newMessage,
});
```

## Usage

### Starting a Stream

```typescript
import { cloudflareService } from '@/app/services/cloudflareService';

const response = await cloudflareService.startLive('My Stream', userId);

// Response includes:
// - stream.id (database ID)
// - ingest_url (RTMP)
// - stream_key (RTMP)
// - rtc_publish_url (WebRTC)
// - playback_url (HLS for viewers)
```

### Stopping a Stream

```typescript
await cloudflareService.stopLive(streamId);
```

### Viewing a Stream

Navigate to `/live-player?streamId=<uuid>` or use the ViewerScreen component directly.

## Environment Variables

Required in Supabase Edge Functions:

- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Stream permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Testing

1. **Broadcaster**: Open broadcaster screen, enter title, tap GO LIVE
2. **Viewer**: Open viewer screen with stream ID
3. **Chat**: Send messages from viewer, see in broadcaster overlay
4. **Viewer Count**: Open multiple viewer tabs, see count update

## Limitations

- WebRTC streaming requires native build or web browser
- Expo Go only shows camera preview
- RTMP fallback available for OBS/external encoders
- HLS playback has ~10-30 second latency (WebRTC has <1 second)

## Next Steps

1. Deploy updated edge functions manually via Supabase Dashboard
2. Test WebRTC streaming on web
3. Build native app with react-native-webrtc for mobile WebRTC
4. Add stream analytics and recording features
5. Implement stream moderation tools
