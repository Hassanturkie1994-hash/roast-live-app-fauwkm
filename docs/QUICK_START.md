
# Livestreaming Feature - Quick Start

## 🚀 Get Started in 5 Minutes

### 1. Update Edge Functions (Required)

**Go to**: [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Edge Functions

#### Update `start-live`:
1. Click on `start-live` function
2. Replace code with implementation from `/docs/WEBRTC_IMPLEMENTATION.md`
3. Deploy

#### Update `stop-live`:
1. Click on `stop-live` function
2. Replace code with implementation from `/docs/WEBRTC_IMPLEMENTATION.md`
3. Deploy

### 2. Verify Environment Variables

**Go to**: Edge Functions → Settings

Ensure these exist:
```
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 3. Test It!

#### As Broadcaster:
1. Open app
2. Tap "Go Live" tab
3. Enter stream title
4. Tap "GO LIVE"
5. ✅ You're streaming!

#### As Viewer:
1. Get stream ID from database or share link
2. Navigate to `/live-player?streamId=<id>`
3. ✅ Watch the stream!

## 📁 Files Created

```
/app/screens/BroadcasterScreen.tsx    ← Broadcaster interface
/app/screens/ViewerScreen.tsx         ← Viewer interface
/components/WebRTCLivePublisher.tsx   ← WebRTC streaming
/app/services/cloudflareService.ts    ← Updated with WebRTC
/docs/WEBRTC_IMPLEMENTATION.md        ← Full documentation
/docs/TESTING_GUIDE.md                ← Testing instructions
/docs/QUICK_START.md                  ← This file
/IMPLEMENTATION_COMPLETE.md           ← Summary
```

## 🎯 Key Features

- ✅ Camera preview
- ✅ GO LIVE button
- ✅ Viewer count (real-time)
- ✅ Duration timer
- ✅ Chat overlay
- ✅ HLS playback
- ✅ Follow/Like/Share
- ✅ WebRTC support (web)

## 🔧 API Endpoints

### Start Stream
```typescript
POST /functions/v1/start-live
Body: { title: string, user_id: string }
Returns: { stream, ingest_url, stream_key, playback_url, rtc_publish_url }
```

### Stop Stream
```typescript
POST /functions/v1/stop-live
Body: { stream_id: string }
Returns: { stream }
```

## 📱 Usage

### Start Streaming
```typescript
import { cloudflareService } from '@/app/services/cloudflareService';

const response = await cloudflareService.startLive('My Stream', userId);
console.log('Stream ID:', response.stream.id);
console.log('Playback URL:', response.playback_url);
```

### Stop Streaming
```typescript
await cloudflareService.stopLive(streamId);
```

### Watch Stream
```typescript
// Navigate to viewer screen
router.push(`/live-player?streamId=${streamId}`);
```

## 🎨 UI Components

All components follow Roast Live design:
- Dark background (#000000)
- Gradient (#A40028 → #E30052)
- White text (#FFFFFF)
- Pill-shaped buttons

## 🔒 Security

- ✅ RTMP credentials server-side only
- ✅ Authentication required
- ✅ RLS policies enabled
- ✅ JWT verification

## 📊 Database

Table: `streams`
- Already exists ✅
- RLS enabled ✅
- Columns: id, broadcaster_id, title, status, playback_url, etc.

## 🌐 Platform Support

| Feature | Web | iOS | Android |
|---------|-----|-----|---------|
| Camera | ✅ | ✅ | ✅ |
| WebRTC | ✅ | ⚠️* | ⚠️* |
| HLS | ✅ | ✅ | ✅ |
| Chat | ✅ | ✅ | ✅ |

*Native WebRTC requires react-native-webrtc

## 🐛 Troubleshooting

**Stream won't start?**
- Check edge function logs
- Verify Cloudflare credentials
- Check user authentication

**Video won't play?**
- Verify playback_url exists
- Check HLS format
- Wait 10-15 seconds for transcoding

**Chat not working?**
- Check Supabase Realtime enabled
- Verify broadcast channel subscription
- Check RLS policies

**Viewer count stuck?**
- Check Presence channel
- Verify multiple tabs open
- Check console for errors

## 📚 Documentation

- **Full Docs**: `/docs/WEBRTC_IMPLEMENTATION.md`
- **Testing**: `/docs/TESTING_GUIDE.md`
- **Summary**: `/IMPLEMENTATION_COMPLETE.md`

## 🎉 You're Ready!

The livestreaming feature is fully implemented and ready to use. Just update the edge functions and start streaming!

**Questions?** Check the full documentation in `/docs/WEBRTC_IMPLEMENTATION.md`
