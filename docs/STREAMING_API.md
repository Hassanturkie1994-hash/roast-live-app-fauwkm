
# Streaming API Reference

This document provides a technical reference for the Cloudflare Stream integration in Roast Live.

## Service: `cloudflareService`

Location: `app/services/cloudflareService.ts`

### Methods

#### `startLive(title: string, broadcasterId: string): Promise<StartLiveResponse>`

Creates a new live stream session.

**Parameters:**
- `title` (string): The title of the stream
- `broadcasterId` (string): The UUID of the broadcaster

**Returns:**
```typescript
{
  success: boolean;
  stream: {
    id: string;                    // Supabase stream ID
    broadcaster_id: string;
    title: string;
    cloudflare_stream_id: string;  // Cloudflare live input ID
    ingest_url: string;            // RTMP ingest URL
    stream_key: string;            // RTMP stream key
    playback_url: string;          // HLS playback URL
    status: string;                // 'live'
    viewer_count: number;
    started_at: string;
  };
  ingest_url: string;
  stream_key: string;
  playback_url: string;
}
```

**Example:**
```typescript
import { cloudflareService } from '@/app/services/cloudflareService';

const response = await cloudflareService.startLive(
  'My Awesome Stream',
  user.id
);

console.log('Stream ID:', response.stream.id);
console.log('RTMP URL:', response.ingest_url);
console.log('Stream Key:', response.stream_key);
console.log('Watch at:', response.playback_url);
```

**Errors:**
- `Not authenticated`: User session not found
- `Failed to start live stream`: Cloudflare API error
- Network errors

---

#### `stopLive(streamId: string): Promise<StopLiveResponse>`

Ends a live stream session.

**Parameters:**
- `streamId` (string): The UUID of the stream to stop

**Returns:**
```typescript
{
  success: boolean;
  stream: {
    id: string;
    status: string;  // 'ended'
    ended_at: string;
  };
}
```

**Example:**
```typescript
await cloudflareService.stopLive(streamId);
console.log('Stream ended successfully');
```

**Errors:**
- `Not authenticated`: User session not found
- `Stream not found`: Invalid stream ID
- `Failed to stop live stream`: Cloudflare API error

---

## Edge Functions

### `start-live`

**Endpoint:** `https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/start-live`

**Method:** POST

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "title": "Stream Title",
  "broadcaster_id": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "stream": { ... },
  "ingest_url": "rtmps://live.cloudflare.com/live/...",
  "stream_key": "unique-stream-key",
  "playback_url": "https://customer-xxx.cloudflarestream.com/xxx/manifest/video.m3u8"
}
```

**What it does:**
1. Validates request and authentication
2. Calls Cloudflare Stream API to create live input
3. Stores stream metadata in Supabase
4. Creates notifications for followers
5. Returns RTMP credentials and playback URL

---

### `stop-live`

**Endpoint:** `https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/stop-live`

**Method:** POST

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "stream_id": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "stream": {
    "id": "uuid-here",
    "status": "ended",
    "ended_at": "2024-01-15T10:30:00Z"
  }
}
```

**What it does:**
1. Validates request and authentication
2. Fetches stream from Supabase
3. Deletes Cloudflare live input (optional)
4. Updates stream status to 'ended'
5. Returns updated stream data

---

## Video Player Integration

### Using expo-video with HLS

```typescript
import { VideoView, useVideoPlayer } from 'expo-video';

const player = useVideoPlayer(
  {
    uri: stream.playback_url,
    contentType: 'hls',  // Important for HLS streams
  },
  (player) => {
    player.loop = false;
    player.play();
  }
);

return (
  <VideoView
    style={styles.video}
    player={player}
    allowsFullscreen
    allowsPictureInPicture
    contentFit="contain"
  />
);
```

### Listening to Player Events

```typescript
import { useEvent } from 'expo';

const { status } = useEvent(player, 'statusChange', {
  status: player.status,
});

useEffect(() => {
  if (status === 'readyToPlay') {
    console.log('Video ready to play');
  } else if (status === 'error') {
    console.error('Video player error');
  }
}, [status]);
```

---

## Database Queries

### Fetch Live Streams

```typescript
const { data: liveStreams } = await supabase
  .from('streams')
  .select('*, users(*)')
  .eq('status', 'live')
  .order('started_at', { ascending: false });
```

### Fetch Stream by ID

```typescript
const { data: stream } = await supabase
  .from('streams')
  .select('*, users(*)')
  .eq('id', streamId)
  .single();
```

### Update Viewer Count

```typescript
await supabase
  .from('streams')
  .update({ viewer_count: newCount })
  .eq('id', streamId);
```

---

## Real-time Chat

### Subscribe to Chat Messages

```typescript
const channel = supabase
  .channel(`stream:${streamId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `stream_id=eq.${streamId}`,
    },
    (payload) => {
      console.log('New message:', payload.new);
    }
  )
  .subscribe();
```

### Send Chat Message

```typescript
await supabase.from('chat_messages').insert({
  stream_id: streamId,
  user_id: user.id,
  message: messageText,
});
```

---

## CDN Optimization

Cloudflare automatically handles:
- **HLS Segment Caching**: Video segments cached at edge
- **Adaptive Bitrate**: Automatic quality switching
- **Global Distribution**: Low latency worldwide
- **DDoS Protection**: Built-in security

No additional configuration needed!

---

## Best Practices

### 1. Error Handling
Always wrap API calls in try-catch blocks:
```typescript
try {
  const response = await cloudflareService.startLive(title, userId);
  // Handle success
} catch (error) {
  console.error('Stream error:', error);
  Alert.alert('Error', error.message);
}
```

### 2. Loading States
Show loading indicators during API calls:
```typescript
const [isLoading, setIsLoading] = useState(false);

const startStream = async () => {
  setIsLoading(true);
  try {
    await cloudflareService.startLive(title, userId);
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Cleanup
Always clean up video players and subscriptions:
```typescript
useEffect(() => {
  return () => {
    player.pause();
    supabase.removeChannel(channel);
  };
}, []);
```

### 4. Security
Never expose RTMP credentials in logs or UI (except to broadcaster):
```typescript
// ❌ Bad
console.log('Stream key:', streamKey);

// ✅ Good
console.log('Stream started:', streamId);
```

---

## Performance Tips

1. **Preload streams**: Create player before showing video
2. **Use adaptive bitrate**: Let expo-video handle quality
3. **Limit chat messages**: Only show recent 50 messages
4. **Debounce viewer count updates**: Update every 5-10 seconds
5. **Use CDN URLs**: Always use Cloudflare playback URLs

---

## Monitoring

### Check Stream Status
```typescript
const { data: stream } = await supabase
  .from('streams')
  .select('status, viewer_count, started_at')
  .eq('id', streamId)
  .single();

console.log('Status:', stream.status);
console.log('Viewers:', stream.viewer_count);
console.log('Duration:', Date.now() - new Date(stream.started_at).getTime());
```

### Edge Function Logs
View logs in Supabase Dashboard:
1. Go to **Edge Functions**
2. Select function (`start-live` or `stop-live`)
3. Click **Logs** tab

---

## Testing

### Unit Tests
```typescript
describe('cloudflareService', () => {
  it('should start a live stream', async () => {
    const response = await cloudflareService.startLive('Test', userId);
    expect(response.success).toBe(true);
    expect(response.ingest_url).toBeDefined();
  });
});
```

### Integration Tests
1. Start stream via API
2. Verify database record created
3. Test RTMP connection with OBS
4. Verify HLS playback works
5. Stop stream and verify status updated

---

## Troubleshooting

### Common Issues

**Issue**: "Cloudflare credentials not configured"
- **Solution**: Set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in Supabase secrets

**Issue**: Video not playing
- **Solution**: Check `playback_url` is valid HLS URL, verify stream is live

**Issue**: RTMP connection failed
- **Solution**: Verify `ingest_url` and `stream_key` are correct, check firewall

**Issue**: High latency
- **Solution**: Use RTMPS instead of RTMP, check network connection

---

## API Rate Limits

Cloudflare Stream API limits:
- **Live Inputs**: 1000 concurrent per account
- **API Calls**: 1200 requests per 5 minutes

For production, implement:
- Request queuing
- Exponential backoff
- Rate limit monitoring
