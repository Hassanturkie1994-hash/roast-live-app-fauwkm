
# Developer Setup Guide - Cloudflare Stream Integration

This guide will help you set up the Cloudflare Stream integration for local development and testing.

## Prerequisites

- Node.js 18+ installed
- Expo CLI installed (`npm install -g expo-cli`)
- Supabase CLI installed (`npm install -g supabase`)
- Cloudflare account with Stream enabled
- OBS Studio (for testing RTMP streaming)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd roast-live

# Install dependencies
npm install
```

## Step 2: Configure Cloudflare

### 2.1 Get Cloudflare Credentials

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Stream** in the sidebar
3. Note your **Account ID** from the URL
4. Go to **My Profile** → **API Tokens**
5. Create a token with **Stream Edit** permissions
6. Save the token securely

### 2.2 Set Supabase Secrets

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref uaqsjqakhgycfopftzzp

# Set secrets
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_account_id_here
supabase secrets set CLOUDFLARE_API_TOKEN=your_api_token_here

# Verify secrets are set
supabase secrets list
```

## Step 3: Deploy Edge Functions

The Edge Functions are already deployed, but if you need to redeploy:

```bash
# Deploy start-live function
supabase functions deploy start-live

# Deploy stop-live function
supabase functions deploy stop-live

# View function logs
supabase functions logs start-live
supabase functions logs stop-live
```

## Step 4: Database Setup

The database schema is already set up with the `stream_key` column. To verify:

```bash
# Connect to your database
supabase db remote commit

# Or check via SQL
supabase db remote exec "SELECT column_name FROM information_schema.columns WHERE table_name = 'streams';"
```

## Step 5: Run the App

```bash
# Start Expo development server
npm run dev

# Or for specific platforms
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
```

## Step 6: Test the Integration

### 6.1 Test Stream Creation

1. Open the app
2. Log in with a test account
3. Navigate to the **Broadcaster** tab
4. Click **START LIVE**
5. Enter a stream title
6. Click **GO LIVE**
7. You should see RTMP credentials displayed

### 6.2 Test RTMP Streaming with OBS

1. Open OBS Studio
2. Go to **Settings** → **Stream**
3. Select **Custom** as Service
4. Enter the RTMP URL from the app
5. Enter the Stream Key from the app
6. Click **OK** and then **Start Streaming**
7. The stream should connect successfully

### 6.3 Test HLS Playback

1. In the app, navigate to the **Home** tab
2. You should see your live stream listed
3. Tap on the stream to open the player
4. The video should load and play automatically
5. Test chat functionality by sending messages

## Step 7: Debugging

### Check Edge Function Logs

```bash
# View real-time logs
supabase functions logs start-live --follow
supabase functions logs stop-live --follow
```

### Check Database Records

```bash
# View streams table
supabase db remote exec "SELECT id, title, status, cloudflare_stream_id FROM streams ORDER BY created_at DESC LIMIT 5;"
```

### Check App Logs

```bash
# In the Expo terminal, look for:
# - "Starting live stream:"
# - "Live stream started successfully:"
# - "Stream data:"
# - "Player status:"
```

### Common Issues

**Issue**: "Cloudflare credentials not configured"
```bash
# Verify secrets are set
supabase secrets list

# If missing, set them again
supabase secrets set CLOUDFLARE_ACCOUNT_ID=your_id
supabase secrets set CLOUDFLARE_API_TOKEN=your_token
```

**Issue**: "Failed to start stream"
```bash
# Check Edge Function logs
supabase functions logs start-live

# Look for Cloudflare API errors
# Verify API token has correct permissions
```

**Issue**: Video not playing
```bash
# Check if playback_url is set
supabase db remote exec "SELECT playback_url FROM streams WHERE id = 'your-stream-id';"

# Verify stream is actually live (broadcasting via OBS)
# Test playback URL directly in browser
```

## Step 8: Environment Variables

The app uses these environment variables (already configured):

```typescript
// Supabase
SUPABASE_URL=https://uaqsjqakhgycfopftzzp.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>

// Cloudflare (stored as Supabase secrets)
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
CLOUDFLARE_API_TOKEN=<your-api-token>
```

## Step 9: Testing Checklist

- [ ] Can create a new stream
- [ ] RTMP credentials are displayed
- [ ] Can connect OBS to RTMP URL
- [ ] Stream appears in home feed
- [ ] Can open stream player
- [ ] HLS video loads and plays
- [ ] Chat messages work
- [ ] Can end stream
- [ ] Stream status updates to "ended"

## Step 10: Production Deployment

### Deploy to Expo

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Verify Production Setup

1. Ensure Cloudflare secrets are set in production Supabase project
2. Test with production API endpoints
3. Monitor Edge Function logs for errors
4. Set up Cloudflare Stream analytics

## Additional Resources

- [Cloudflare Stream Docs](https://developers.cloudflare.com/stream/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [expo-video Documentation](https://docs.expo.dev/versions/latest/sdk/video/)
- [OBS Studio Guide](https://obsproject.com/wiki/)

## Support

For issues:
1. Check Edge Function logs: `supabase functions logs <function-name>`
2. Check app console logs in Expo
3. Verify Cloudflare Stream dashboard for live inputs
4. Test RTMP connection with OBS
5. Verify database records in Supabase dashboard

## Next Steps

- Implement viewer count tracking
- Add stream thumbnails
- Implement stream recording
- Add stream analytics
- Implement moderation tools
- Add stream categories/tags
- Implement stream scheduling
