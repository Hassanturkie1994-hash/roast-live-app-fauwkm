
# Cloudflare R2 + FCM Implementation Summary

## Overview

This implementation integrates Cloudflare R2 object storage with CDN delivery and Firebase Cloud Messaging (FCM) for push notifications in the Roast Live app. All client uploads and signed URL generation are routed through Supabase Edge Functions for security.

## What Was Implemented

### 1. App Configuration (`app.config.js`)

✅ Added runtime environment variables:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `CLOUDFLARE_R2_PUBLIC_BASE_URL`
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_FUNCTIONS_URL`

✅ Configured `expo-notifications` plugin with:
- Icon and color settings
- Android-specific configuration
- Sound files support

✅ Added `autolinking.exclude` for `react-native-nodemediaclient`

✅ Added `googleServicesFile` reference for Android FCM

### 2. Supabase Edge Functions

✅ **upload-to-r2** (`/functions/v1/upload-to-r2`)
- Accepts: `{ fileName, fileType, mediaType }`
- Returns: Presigned PUT URL for R2 upload
- Authenticates caller via JWT or x-user-id header
- Generates AWS Signature V4 for presigned URLs
- Supports media types: profile, story, post, gift, thumbnail, other

✅ **sign-url** (`/functions/v1/sign-url`)
- Accepts: `{ path, expiresIn, watermark }`
- Returns: Signed CDN URL with expiration (default 10 min)
- Uses HMAC-SHA256 for signature
- Supports custom watermarks

✅ **send-push-notification** (updated)
- Accepts: `{ userId, tokens, notification }`
- Sends via FCM to Android/iOS devices
- Records results to `push_notifications_log` table
- Deactivates invalid tokens automatically
- Enhanced error handling and logging

✅ **check-ban-expirations** (existing, uses send-push-notification)
- Checks for expired bans and strikes
- Sends push notifications via `send-push-notification`
- Creates in-app notifications
- Scheduled via Supabase Cron

### 3. Client Services

✅ **R2 Service** (`app/services/r2Service.ts`)
- `getUploadUrl()` - Get presigned upload URL
- `uploadFile()` - Upload file to R2
- `getSignedUrl()` - Get signed CDN URL
- `uploadProfileImage()` - Upload profile image
- `uploadStoryMedia()` - Upload story media
- `uploadPostMedia()` - Upload post media
- `uploadThumbnail()` - Upload thumbnail
- `isR2Url()` - Check if URL is R2
- `extractPathFromUrl()` - Extract path from R2 URL

✅ **Push Notification Service** (existing, already configured)
- FCM integration via Edge Function
- Device token registration
- Notification preferences
- Rate limiting
- Quiet hours support
- Batched notifications

### 4. Documentation

✅ **CLOUDFLARE_R2_FCM_SETUP_GUIDE.md**
- Complete setup instructions
- Cloudflare R2 configuration
- Firebase FCM setup
- EAS build configuration
- Environment variables guide
- Testing procedures

✅ **R2_FCM_QUICK_REFERENCE.md**
- Quick code examples
- API reference
- Common patterns
- Troubleshooting tips

✅ **.env.example**
- Template for environment variables
- Setup instructions
- Security notes

## What Was NOT Implemented

❌ **Cloudflare Stream API**
- As per requirements, Cloudflare Stream is NOT used
- Live streaming uses WebRTC, not Cloudflare Stream
- R2 is only for static assets (images, thumbnails, gifts)

❌ **Web Push Notifications**
- Only Android/iOS FCM is implemented
- Web push can be added later if needed

❌ **Automatic Migration Scripts**
- Database tables already exist (push_device_tokens, push_notifications_log, etc.)
- No new migrations needed

## Required Setup Steps

### 1. Cloudflare R2

1. Create R2 bucket: `roast-live-media`
2. Generate API tokens (Access Key ID, Secret Access Key)
3. Enable public access (optional)
4. Configure custom domain (optional)

### 2. Firebase FCM

1. Create Firebase project
2. Add Android app with package: `com.roastlive.roastlive`
3. Download `google-services.json` to project root
4. Get FCM Server Key from Firebase Console

### 3. Supabase Secrets

Set the following secrets in Supabase:

```bash
supabase secrets set CF_R2_ACCESS_KEY_ID="..."
supabase secrets set CF_R2_SECRET_ACCESS_KEY="..."
supabase secrets set CF_R2_BUCKET="roast-live-media"
supabase secrets set CLOUDFLARE_ACCOUNT_ID="..."
supabase secrets set CF_API_TOKEN="..."
supabase secrets set CF_SIGNING_SECRET="..." # Generate random 32-char string
supabase secrets set FCM_SERVER_KEY="..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="..."
```

### 4. EAS Secrets

Set the following secrets in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
eas secret:create --scope project --name CLOUDFLARE_R2_PUBLIC_BASE_URL --value "..."
eas secret:create --scope project --name CLOUDFLARE_ACCOUNT_ID --value "..."
eas secret:create --scope project --name EXPO_PUBLIC_PROJECT_ID --value "..."
```

### 5. Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in the values
3. Never commit `.env.local` to git

## Usage Examples

### Upload a File

```typescript
import { r2Service } from '@/app/services/r2Service';

const result = await r2Service.uploadProfileImage(file, userId);
if (result.success) {
  // Save result.publicUrl to database
  await supabase
    .from('profiles')
    .update({ avatar_url: result.publicUrl })
    .eq('id', userId);
}
```

### Get Signed URL

```typescript
import { r2Service } from '@/app/services/r2Service';

const result = await r2Service.getSignedUrl(
  'profile/user-id/avatar.jpg',
  600 // 10 minutes
);

if (result.success) {
  // Use result.signedUrl for secure access
}
```

### Send Push Notification

```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

await pushNotificationService.sendPushNotification(
  userId,
  'GIFT_RECEIVED',
  'You received a gift!',
  'John sent you a Rose worth 50 kr.',
  { route: 'GiftActivity', giftId: 'gift-id' }
);
```

## Testing

### Test R2 Upload

```typescript
const file = new Blob(['test'], { type: 'text/plain' });
const result = await r2Service.uploadFile(file, 'test.txt', 'other');
console.log('Upload result:', result);
```

### Test Push Notification

```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'SYSTEM_WARNING',
  'Test Notification',
  'This is a test',
  { route: 'Home' }
);
```

### Test on Device

1. Build with EAS: `eas build --platform android --profile development`
2. Install on device
3. Log in to register device token
4. Send test notification from admin panel

## Important Notes

### Security

- ✅ All secrets are stored in Supabase/EAS, not in git
- ✅ Client uploads go through Edge Functions (no direct R2 access)
- ✅ Signed URLs have expiration times
- ✅ Invalid FCM tokens are automatically deactivated

### Limitations

- ⚠️ Expo Go does NOT support FCM on Android (SDK 53+)
- ⚠️ Must use EAS development build for testing
- ⚠️ Web push notifications not implemented
- ⚠️ Cloudflare Stream API not used (as per requirements)

### Best Practices

- ✅ Use R2 for static assets only (images, thumbnails, gifts)
- ✅ Use WebRTC for live streaming (not Cloudflare Stream)
- ✅ Set appropriate expiration times for signed URLs
- ✅ Respect user notification preferences
- ✅ Monitor Edge Function logs for errors
- ✅ Rotate signing secrets regularly

## Files Modified/Created

### Modified
- `app.config.js` - Added environment variables and FCM configuration
- `supabase/functions/send-push-notification/index.ts` - Enhanced FCM integration

### Created
- `supabase/functions/upload-to-r2/index.ts` - R2 upload Edge Function
- `supabase/functions/sign-url/index.ts` - Signed URL Edge Function
- `app/services/r2Service.ts` - Client-side R2 service
- `CLOUDFLARE_R2_FCM_SETUP_GUIDE.md` - Complete setup guide
- `R2_FCM_QUICK_REFERENCE.md` - Quick reference guide
- `R2_FCM_IMPLEMENTATION_SUMMARY.md` - This file
- `.env.example` - Environment variables template

## Next Steps

1. **Set up Cloudflare R2**
   - Create bucket
   - Generate API tokens
   - Configure public access

2. **Set up Firebase FCM**
   - Create project
   - Add Android app
   - Download google-services.json
   - Get FCM Server Key

3. **Configure Secrets**
   - Set Supabase secrets
   - Set EAS secrets
   - Create .env.local

4. **Test Integration**
   - Test R2 uploads
   - Test signed URLs
   - Test push notifications

5. **Build and Deploy**
   - Build with EAS
   - Test on real device
   - Deploy to production

## Support

For issues or questions:
- Check Edge Function logs in Supabase dashboard
- Review Cloudflare R2 dashboard
- Check Firebase Console for FCM delivery status
- Review EAS build logs
- Refer to setup guides and quick reference

