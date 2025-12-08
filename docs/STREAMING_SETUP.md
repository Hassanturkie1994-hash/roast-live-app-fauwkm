
# Roast Live - Streaming Setup Guide

## Prerequisites

1. **Cloudflare Account**
   - Sign up at https://cloudflare.com
   - Enable Cloudflare Stream
   - Get your Account ID and API Token

2. **Supabase Project**
   - Already configured (project ID: uaqsjqakhgycfopftzzp)
   - Edge Functions deployed
   - Database tables created

## Step 1: Configure Cloudflare Credentials

### Get Cloudflare Account ID
1. Login to Cloudflare Dashboard
2. Go to any domain or Stream section
3. Copy your Account ID from the URL or sidebar

### Create API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Stream" template
4. Or create custom token with permissions:
   - Stream: Edit
   - Account: Read
5. Copy the generated token

### Add to Supabase Edge Functions

Run these commands in your terminal:

```bash
# Set Cloudflare Account ID
npx supabase secrets set CLOUDFLARE_ACCOUNT_ID=your-account-id-here

# Set Cloudflare API Token
npx supabase secrets set CLOUDFLARE_API_TOKEN=your-api-token-here
```

Or set them in the Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/uaqsjqakhgycfopftzzp/settings/functions
2. Click "Edge Functions"
3. Add secrets:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`

## Step 2: Verify Edge Functions

The following Edge Functions should already be deployed:

### start-live
- Creates Cloudflare live input
- Stores stream metadata in Supabase
- Returns RTMP credentials and HLS playback URL

### stop-live
- Ends the live stream
- Updates stream status in Supabase
- Optionally deletes Cloudflare live input

To verify they're working:

```bash
# Test start-live
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/start-live \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Stream", "broadcaster_id": "YOUR_USER_ID"}'

# Test stop-live
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/stop-live \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stream_id": "STREAM_ID_FROM_START_LIVE"}'
```

## Step 3: Database Setup

All required tables should already exist:
- `users`
- `streams`
- `chat_messages`
- `followers`
- `notifications`

Verify with:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Step 4: Enable Supabase Realtime

1. Go to https://supabase.com/dashboard/project/uaqsjqakhgycfopftzzp/database/replication
2. Enable Realtime for these tables:
   - `streams`
   - `chat_messages`
3. Click "Save"

## Step 5: Test the App

### Test Broadcaster Flow

1. **Login**
   ```
   - Open app
   - Navigate to Login
   - Login with test account
   ```

2. **Start Stream**
   ```
   - Navigate to Broadcaster tab
   - Tap "GO LIVE"
   - Enter stream title
   - Tap "GO LIVE" in modal
   ```

3. **Verify**
   ```
   - LIVE badge should appear
   - Timer should start counting
   - Viewer count should show 0
   ```

4. **For Native Builds Only**
   ```
   - Camera should automatically start streaming
   - No RTMP credentials shown to user
   ```

5. **For Expo Go / Web**
   ```
   - RTMP credentials will be shown
   - Use OBS to stream:
     - Server: rtmps://live.cloudflare.com/live
     - Stream Key: (from alert)
   ```

### Test Viewer Flow

1. **Find Stream**
   ```
   - Login as different user
   - Navigate to Home tab
   - See live stream in list
   ```

2. **Watch Stream**
   ```
   - Tap on stream card
   - Video should start playing
   - Viewer count should increment
   ```

3. **Test Chat**
   ```
   - Type message in chat input
   - Tap send
   - Message should appear in chat
   - Broadcaster should see message
   ```

4. **Test Follow**
   ```
   - Tap Follow button
   - Button should change to "Following"
   - Broadcaster should receive notification
   ```

## Step 6: OBS Setup (For Testing Without Native Build)

### Download OBS
- Download from https://obsproject.com/
- Install and open OBS

### Configure OBS for Cloudflare Stream

1. **Settings → Stream**
   ```
   Service: Custom
   Server: rtmps://live.cloudflare.com/live
   Stream Key: (from app alert)
   ```

2. **Settings → Output**
   ```
   Output Mode: Advanced
   Encoder: x264
   Rate Control: CBR
   Bitrate: 2000 Kbps
   Keyframe Interval: 2
   Preset: veryfast
   Profile: baseline
   ```

3. **Settings → Video**
   ```
   Base Resolution: 1280x720
   Output Resolution: 1280x720
   FPS: 30
   ```

4. **Settings → Audio**
   ```
   Sample Rate: 44.1 kHz
   Channels: Stereo
   ```

5. **Add Sources**
   ```
   - Video Capture Device (your camera)
   - Audio Input Capture (your microphone)
   ```

6. **Start Streaming**
   ```
   - Click "Start Streaming"
   - Video should appear in app player
   ```

## Step 7: Native Build Setup (For Production)

### Install Dependencies

Already installed:
```json
{
  "react-native-nodemediaclient": "^0.3.6"
}
```

### iOS Configuration

Add to `app.json`:
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

### Android Configuration

Add to `app.json`:
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

### Build Native App

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Troubleshooting

### Issue: "Cloudflare credentials not configured"

**Solution:**
- Verify secrets are set in Supabase
- Check Edge Function logs
- Ensure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are correct

### Issue: Video not playing

**Solution:**
- Check if stream status is 'live'
- Verify playback_url is valid HLS URL
- Check Cloudflare Stream dashboard
- Ensure broadcaster is actually streaming

### Issue: Chat messages not appearing

**Solution:**
- Verify Supabase Realtime is enabled
- Check browser console for errors
- Verify RLS policies allow message insertion
- Check network tab for WebSocket connection

### Issue: Viewer count not updating

**Solution:**
- Verify Presence tracking is working
- Check channel subscriptions
- Verify broadcast events are being sent
- Check Supabase Realtime logs

### Issue: Native streaming not working

**Solution:**
- Verify react-native-nodemediaclient is installed
- Check native build configuration
- Verify camera/microphone permissions
- Check device compatibility
- Review native logs

## Production Checklist

- [ ] Cloudflare credentials configured
- [ ] Edge Functions deployed and tested
- [ ] Database tables created with RLS
- [ ] Supabase Realtime enabled
- [ ] Camera/microphone permissions configured
- [ ] Native build created and tested
- [ ] OBS fallback tested
- [ ] Chat system tested with multiple users
- [ ] Viewer tracking tested
- [ ] Follow system tested
- [ ] Notifications tested
- [ ] Error handling tested
- [ ] Network failure handling tested

## Monitoring

### Cloudflare Stream Dashboard
- Monitor active streams
- Check bandwidth usage
- View recording storage
- Check transcoding status

### Supabase Dashboard
- Monitor database queries
- Check Realtime connections
- View Edge Function logs
- Monitor API usage

### App Analytics
- Track stream starts
- Monitor viewer counts
- Track chat activity
- Monitor follow conversions

## Cost Estimation

### Cloudflare Stream
- $5/month per 1,000 minutes streamed
- $1/month per 1,000 minutes stored
- Free tier: 1,000 minutes/month

### Supabase
- Free tier: 500MB database, 2GB bandwidth
- Pro: $25/month (8GB database, 50GB bandwidth)
- Realtime: Included in all plans

## Support Resources

- Cloudflare Stream Docs: https://developers.cloudflare.com/stream/
- Supabase Realtime Docs: https://supabase.com/docs/guides/realtime
- React Native NodeMediaClient: https://github.com/NodeMedia/react-native-nodemediaclient
- Expo Camera: https://docs.expo.dev/versions/latest/sdk/camera/

## Next Steps

1. Configure Cloudflare credentials
2. Test streaming with OBS
3. Build native app for full functionality
4. Test with multiple concurrent users
5. Monitor performance and costs
6. Implement additional features (reactions, gifts, etc.)
