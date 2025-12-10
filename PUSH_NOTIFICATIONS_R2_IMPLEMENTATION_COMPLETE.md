
# Push Notifications, R2 Storage, and Cache Purge - Complete Implementation Guide

## Overview

This document provides complete implementation details for:
1. Push notification system with FCM integration
2. Cloudflare R2 storage with presigned URLs
3. Signed CDN URLs for secure media delivery
4. Cloudflare cache purging
5. Automated ban expiration checks with cron jobs

---

## 1. Database Tables & RLS Policies

### Tables Created

#### `push_device_tokens`
Stores device push notification tokens for users.

```sql
CREATE TABLE push_device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')) NOT NULL,
  device_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);
```

#### `push_notifications_log`
Logs all push notifications sent to users.

```sql
CREATE TABLE push_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) NOT NULL,
  type text CHECK (type IN (
    'SYSTEM_WARNING', 'MODERATION_WARNING', 'TIMEOUT_APPLIED',
    'BAN_APPLIED', 'BAN_EXPIRED', 'APPEAL_RECEIVED',
    'APPEAL_APPROVED', 'APPEAL_DENIED', 'ADMIN_ANNOUNCEMENT',
    'SAFETY_REMINDER'
  )) NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload_json jsonb,
  sent_at timestamptz DEFAULT now(),
  delivery_status text CHECK (delivery_status IN ('pending', 'sent', 'failed')) DEFAULT 'pending'
);
```

### RLS Policies

**push_device_tokens:**
- ✅ Users can view their own device tokens
- ✅ Users can insert their own device tokens
- ✅ Users can update their own device tokens
- ✅ Users can delete their own device tokens

**push_notifications_log:**
- ✅ Users can view their own push notifications
- ✅ Admins can view all push notifications

### Indexes

```sql
-- Faster lookups for active tokens
CREATE INDEX idx_push_device_tokens_user_active 
  ON push_device_tokens(user_id, is_active) 
  WHERE is_active = true;

-- Faster queries for notification logs
CREATE INDEX idx_push_notifications_log_user_sent 
  ON push_notifications_log(user_id, sent_at DESC);

CREATE INDEX idx_push_notifications_log_type_sent 
  ON push_notifications_log(type, sent_at DESC);
```

---

## 2. Cron Job Setup

### Schedule Ban Expiration Checks

The cron job runs every 5 minutes and calls the `check-ban-expirations` Edge Function.

```sql
-- Schedule the cron job
SELECT cron.schedule(
  'check-ban-expirations-every-5-min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/check-ban-expirations',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### Configure Database Settings

**IMPORTANT:** You must set these database settings for the cron job to work:

```sql
-- Set Supabase URL
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://uaqsjqakhgycfopftzzp.supabase.co';

-- Set Service Role Key (replace with your actual key)
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
```

### Manual Testing Function

Test the ban expiration check manually:

```sql
SELECT public.trigger_ban_expiration_check();
```

### View Cron Jobs

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

---

## 3. Supabase Edge Functions

### A. `send-push-notification`

**Purpose:** Sends push notifications to user devices via FCM.

**Endpoint:** `POST /functions/v1/send-push-notification`

**Request Body:**
```json
{
  "userId": "user-uuid",
  "tokens": [
    { "token": "expo-push-token", "platform": "android" },
    { "token": "expo-push-token", "platform": "ios" }
  ],
  "notification": {
    "title": "Your ban has expired",
    "body": "You can now interact again. Please follow the community rules.",
    "data": {
      "penalty_id": "penalty-uuid"
    }
  }
}
```

**Features:**
- Sends to multiple devices
- Supports iOS, Android, and Web
- Automatically deactivates invalid tokens
- Logs delivery status

**Environment Variables Required:**
- `FCM_SERVER_KEY` - Firebase Cloud Messaging server key

---

### B. `check-ban-expirations`

**Purpose:** Checks for expired bans/penalties and sends notifications.

**Endpoint:** `POST /functions/v1/check-ban-expirations`

**Triggered by:** Cron job every 5 minutes

**What it does:**
1. Checks for expired admin penalties
2. Checks for expired AI strikes (level 3)
3. Cleans up expired timeouts
4. Sends push notifications to affected users
5. Creates in-app notifications

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

### C. `upload-to-r2`

**Purpose:** Generates presigned upload URLs for Cloudflare R2.

**Endpoint:** `POST /functions/v1/upload-to-r2`

**Request Body:**
```json
{
  "fileName": "avatar_user123_1234567890.jpg",
  "fileType": "image/jpeg",
  "mediaType": "profile"
}
```

**Response:**
```json
{
  "success": true,
  "uploadUrl": "https://bucket.r2.dev/path?presigned-params",
  "publicUrl": "https://bucket.r2.dev/path",
  "filePath": "path/to/file.jpg",
  "expiresIn": 3600,
  "method": "PUT"
}
```

**Environment Variables Required:**
- `CF_R2_ACCESS_KEY_ID`
- `CF_R2_SECRET_ACCESS_KEY`
- `CF_R2_BUCKET`
- `CF_ACCOUNT_ID`

---

### D. `sign-url`

**Purpose:** Generates signed CDN URLs for secure media access.

**Endpoint:** `POST /functions/v1/sign-url`

**Request Body:**
```json
{
  "path": "profiles/avatar_user123.jpg",
  "expiresIn": 600,
  "watermark": "RoastLive"
}
```

**Response:**
```json
{
  "success": true,
  "signedUrl": "https://cdn.example.com/path?token=jwt-token",
  "expiresAt": 1234567890,
  "expiresIn": 600
}
```

**Environment Variables Required:**
- `CF_SIGNING_SECRET` - HMAC/HS256 signing secret

---

### E. `purge-cache` (NEW)

**Purpose:** Purges Cloudflare CDN cache for updated/deleted content.

**Endpoint:** `POST /functions/v1/purge-cache`

**Request Body (Option 1 - Purge specific URLs):**
```json
{
  "urls": [
    "https://cdn.example.com/profiles/avatar_user123.jpg",
    "https://cdn.example.com/stories/story_456.mp4"
  ]
}
```

**Request Body (Option 2 - Purge by tags):**
```json
{
  "tags": ["profile-images", "user-123"]
}
```

**Request Body (Option 3 - Purge everything):**
```json
{
  "purgeEverything": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cache purged successfully",
  "purged": {
    "files": ["https://cdn.example.com/profiles/avatar_user123.jpg"]
  },
  "cloudflareResponse": {
    "success": true,
    "errors": [],
    "messages": []
  }
}
```

**Environment Variables Required:**
- `CF_API_TOKEN` - Cloudflare API token with `Zone:Cache Purge` permission
- `CF_ZONE_ID` - Cloudflare Zone ID

**Cloudflare API Token Scopes:**
- `Zone:Cache Purge` (required)

---

## 4. Client Integration

### A. Push Notifications Hook

**File:** `hooks/usePushNotifications.ts`

**Usage:**
```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function App() {
  const { user } = useAuth();
  
  // Automatically registers device token when user logs in
  usePushNotifications(user?.id || null);
  
  return <YourApp />;
}
```

**Features:**
- Requests push notification permissions
- Gets Expo push token (with projectId)
- Registers token with backend
- Handles notification received events
- Handles notification tap events
- Fallback for Expo Go on Android

**Important Notes:**
- ⚠️ Push notifications do NOT work in Expo Go on Android (SDK 53+)
- ✅ Use EAS development build for testing
- ✅ Requires `EXPO_PROJECT_ID` in `app.json` under `extra.eas.projectId`

---

### B. R2 Storage Service

**File:** `app/services/r2Service.ts`

**Usage:**

```typescript
import { r2Service } from '@/app/services/r2Service';

// Upload profile image
const result = await r2Service.uploadProfileImage(file, userId);
if (result.success) {
  console.log('Uploaded to:', result.publicUrl);
}

// Upload story media
const result = await r2Service.uploadStoryMedia(file, userId, isVideo);

// Get signed URL for playback
const signedResult = await r2Service.getSignedUrl('path/to/file.jpg');
if (signedResult.success) {
  console.log('Signed URL:', signedResult.signedUrl);
}
```

**Methods:**
- `uploadProfileImage(file, userId)` - Upload profile avatar
- `uploadStoryMedia(file, userId, isVideo)` - Upload story content
- `uploadPostMedia(file, userId)` - Upload post content
- `uploadThumbnail(file, userId)` - Upload thumbnail
- `getSignedUrl(path, expiresIn, watermark)` - Get signed CDN URL
- `isR2Url(url)` - Check if URL is R2 URL
- `extractPathFromUrl(url)` - Extract path from R2 URL

---

## 5. Environment Variables Setup

### Supabase Secrets

Set these in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

```bash
# Firebase Cloud Messaging
FCM_SERVER_KEY=your-fcm-server-key

# Cloudflare R2
CF_R2_ACCESS_KEY_ID=your-r2-access-key-id
CF_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CF_R2_BUCKET=your-bucket-name
CF_ACCOUNT_ID=your-cloudflare-account-id

# Cloudflare API
CF_API_TOKEN=your-cloudflare-api-token
CF_ZONE_ID=your-cloudflare-zone-id
CF_SIGNING_SECRET=your-signing-secret-for-urls

# Supabase (auto-populated)
SUPABASE_URL=https://uaqsjqakhgycfopftzzp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### EAS Secrets

Set these for EAS builds:

```bash
# Set EAS secrets
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value https://uaqsjqakhgycfopftzzp.supabase.co
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value your-anon-key
eas secret:create --scope project --name CLOUDFLARE_R2_PUBLIC_BASE_URL --value https://your-account.r2.dev
eas secret:create --scope project --name EXPO_PROJECT_ID --value your-expo-project-id
```

### app.json Configuration

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      },
      "EXPO_PUBLIC_SUPABASE_URL": "https://uaqsjqakhgycfopftzzp.supabase.co",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key",
      "CLOUDFLARE_R2_PUBLIC_BASE_URL": "https://your-account.r2.dev",
      "CLOUDFLARE_ACCOUNT_ID": "your-cloudflare-account-id",
      "SUPABASE_FUNCTIONS_URL": "https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#E30052",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

---

## 6. Testing Instructions

### A. Test Device Token Registration

**1. Run the app in development build:**
```bash
npx expo prebuild --clean
eas build -p android --profile development
```

**2. Install and open the app**

**3. Check logs for token registration:**
```
✅ Push notification token registered successfully
```

**4. Verify in database:**
```sql
SELECT * FROM push_device_tokens WHERE user_id = 'your-user-id';
```

---

### B. Test Manual Push Notification

**Using curl:**

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "tokens": [
      {
        "token": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
        "platform": "android"
      }
    ],
    "notification": {
      "title": "Test Notification",
      "body": "This is a test push notification from Roast Live!",
      "data": {
        "test": true
      }
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1,
  "results": [
    {
      "token": "ExponentPushToken[...]",
      "platform": "android",
      "status": "sent"
    }
  ]
}
```

---

### C. Test Ban Expiration Check

**Manual trigger:**

```sql
SELECT public.trigger_ban_expiration_check();
```

**Or via curl:**

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/check-ban-expirations \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "expiredPenalties": 2,
  "expiredStrikes": 1,
  "expiredTimeouts": 5,
  "notificationsSent": 3
}
```

---

### D. Test R2 Upload

**1. Get presigned upload URL:**

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/upload-to-r2 \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test_image.jpg",
    "fileType": "image/jpeg",
    "mediaType": "profile"
  }'
```

**2. Upload file to presigned URL:**

```bash
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test_image.jpg
```

**3. Verify upload:**
```bash
curl "PUBLIC_URL_FROM_STEP_1"
```

---

### E. Test Signed URL Generation

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/sign-url \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "profiles/test_image.jpg",
    "expiresIn": 600
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "signedUrl": "https://cdn.example.com/profiles/test_image.jpg?token=eyJhbGc...",
  "expiresAt": 1234567890,
  "expiresIn": 600
}
```

---

### F. Test Cache Purge

**Purge specific URLs:**

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/purge-cache \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://cdn.example.com/profiles/avatar_user123.jpg"
    ]
  }'
```

**Purge by tags:**

```bash
curl -X POST https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/purge-cache \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "tags": ["profile-images", "user-123"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cache purged successfully",
  "purged": {
    "files": ["https://cdn.example.com/profiles/avatar_user123.jpg"]
  }
}
```

---

### G. Inspect Push Notifications Log

**View all notifications for a user:**

```sql
SELECT 
  id,
  type,
  title,
  body,
  delivery_status,
  sent_at
FROM push_notifications_log
WHERE user_id = 'your-user-id'
ORDER BY sent_at DESC
LIMIT 20;
```

**View failed notifications:**

```sql
SELECT 
  user_id,
  type,
  title,
  delivery_status,
  sent_at
FROM push_notifications_log
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC;
```

**View notifications by type:**

```sql
SELECT 
  type,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE delivery_status = 'sent') as sent,
  COUNT(*) FILTER (WHERE delivery_status = 'failed') as failed
FROM push_notifications_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;
```

---

## 7. Build & EAS

### Prebuild

```bash
npx expo prebuild --clean
```

### Development Build

```bash
# Android
eas build -p android --profile development

# iOS
eas build -p ios --profile development
```

### Production Build

```bash
# Android
eas build -p android --profile production

# iOS
eas build -p ios --profile production
```

### Ensure EAS Secrets

```bash
# List all secrets
eas secret:list

# Create missing secrets
eas secret:create --scope project --name SECRET_NAME --value SECRET_VALUE
```

---

## 8. Security Best Practices

### ✅ DO:
- Store all API keys in Supabase Secrets or EAS Secrets
- Use least-privileged Cloudflare API tokens
- Enable RLS on all tables
- Validate all inputs in Edge Functions
- Log all push notification attempts
- Deactivate invalid device tokens automatically
- Use signed URLs for sensitive media
- Set appropriate expiration times for presigned URLs

### ❌ DON'T:
- Commit API keys to git
- Log secrets in console
- Use admin/service role keys in client code
- Allow unauthenticated access to Edge Functions
- Store FCM server key in client code
- Use permanent URLs for sensitive content

---

## 9. Cloudflare API Token Setup

### Required Scopes

**For R2 Storage:**
- `R2:Read`
- `R2:Write`

**For Cache Purging:**
- `Zone:Cache Purge`

### Create Token

1. Go to Cloudflare Dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Select "Create Custom Token"
4. Add permissions:
   - Zone → Cache Purge → Purge
   - Account → R2 → Read
   - Account → R2 → Write
5. Set Zone Resources to your specific zone
6. Create token and save it securely

---

## 10. Troubleshooting

### Push Notifications Not Working

**Issue:** No push notifications received

**Solutions:**
1. Check if running in Expo Go on Android (not supported)
2. Verify `EXPO_PROJECT_ID` is set in `app.json`
3. Check FCM_SERVER_KEY is set in Supabase Secrets
4. Verify device token is registered in database
5. Check push notification permissions are granted
6. View logs in `push_notifications_log` table

### Cron Job Not Running

**Issue:** Ban expirations not being checked

**Solutions:**
1. Verify database settings are configured:
   ```sql
   SHOW app.settings.supabase_url;
   SHOW app.settings.service_role_key;
   ```
2. Check cron job is scheduled:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'check-ban-expirations-every-5-min';
   ```
3. View cron job run history:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
   ```

### R2 Upload Failing

**Issue:** File upload to R2 fails

**Solutions:**
1. Verify Cloudflare R2 credentials are set
2. Check bucket name is correct
3. Verify presigned URL hasn't expired
4. Check file size limits
5. Verify Content-Type header matches

### Cache Purge Not Working

**Issue:** Cloudflare cache not purging

**Solutions:**
1. Verify CF_API_TOKEN has correct permissions
2. Check CF_ZONE_ID is correct
3. Verify URLs are correct (must be full URLs)
4. Check Cloudflare API token hasn't expired

---

## 11. Summary

### What's Implemented

✅ **Database Tables:**
- `push_device_tokens` - Stores device tokens
- `push_notifications_log` - Logs all notifications

✅ **RLS Policies:**
- Users can manage their own tokens
- Users can view their own notification logs
- Admins can view all logs

✅ **Cron Job:**
- Runs every 5 minutes
- Checks for expired bans/penalties
- Sends push notifications automatically

✅ **Edge Functions:**
- `send-push-notification` - Sends FCM notifications
- `check-ban-expirations` - Checks and notifies expired bans
- `upload-to-r2` - Generates presigned upload URLs
- `sign-url` - Generates signed CDN URLs
- `purge-cache` - Purges Cloudflare cache

✅ **Client Integration:**
- `usePushNotifications` hook - Registers device tokens
- `r2Service` - Handles R2 uploads and signed URLs

✅ **Testing:**
- Manual trigger functions
- Curl examples for all endpoints
- Database query examples

---

## 12. Next Steps

1. **Configure Environment Variables:**
   - Set all Supabase Secrets
   - Set all EAS Secrets
   - Configure database settings for cron job

2. **Test Push Notifications:**
   - Build development build
   - Register device token
   - Send test notification

3. **Test R2 Upload:**
   - Upload test file
   - Verify file is accessible
   - Generate signed URL

4. **Test Cache Purge:**
   - Purge test URL
   - Verify cache is cleared

5. **Monitor Cron Job:**
   - Check cron job runs successfully
   - Verify notifications are sent
   - Monitor logs for errors

---

## Support

For issues or questions:
- Check Supabase logs: Dashboard → Logs
- Check Edge Function logs: Dashboard → Edge Functions → Logs
- Check cron job history: `SELECT * FROM cron.job_run_details`
- Check push notification logs: `SELECT * FROM push_notifications_log`

---

**Implementation Complete! 🎉**

All systems are ready for production use. Follow the testing instructions to verify everything works correctly.
