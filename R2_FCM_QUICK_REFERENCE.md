
# Cloudflare R2 + FCM Quick Reference

Quick reference for developers working with Cloudflare R2 storage and Firebase Cloud Messaging in Roast Live.

## R2 Service Usage

### Upload a File

```typescript
import { r2Service } from '@/app/services/r2Service';

// Upload profile image
const result = await r2Service.uploadProfileImage(file, userId);
if (result.success) {
  console.log('Uploaded to:', result.publicUrl);
  // Save publicUrl to database
}

// Upload story media
const result = await r2Service.uploadStoryMedia(file, userId, isVideo);

// Upload post media
const result = await r2Service.uploadPostMedia(file, userId);

// Upload thumbnail
const result = await r2Service.uploadThumbnail(file, userId);

// Generic upload
const result = await r2Service.uploadFile(file, 'filename.jpg', 'other');
```

### Get Signed URL

```typescript
import { r2Service } from '@/app/services/r2Service';

// Get signed URL for secure access
const result = await r2Service.getSignedUrl(
  'profile/user-id/avatar.jpg',
  600, // expires in 10 minutes
  'RoastLive' // watermark
);

if (result.success) {
  console.log('Signed URL:', result.signedUrl);
  // Use signedUrl for secure access
}
```

### Check if URL is R2

```typescript
import { r2Service } from '@/app/services/r2Service';

const isR2 = r2Service.isR2Url(url);
if (isR2) {
  // Handle R2 URL
}
```

---

## Push Notifications

### Send Push Notification

```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Send notification
await pushNotificationService.sendPushNotification(
  userId,
  'SYSTEM_WARNING',
  'Notification Title',
  'Notification body text',
  {
    route: 'Profile',
    userId: 'target-user-id',
  }
);
```

### Notification Types

```typescript
type PushNotificationType =
  | 'SYSTEM_WARNING'
  | 'MODERATION_WARNING'
  | 'TIMEOUT_APPLIED'
  | 'BAN_APPLIED'
  | 'BAN_EXPIRED'
  | 'APPEAL_RECEIVED'
  | 'APPEAL_APPROVED'
  | 'APPEAL_DENIED'
  | 'ADMIN_ANNOUNCEMENT'
  | 'SAFETY_REMINDER'
  | 'STREAM_STARTED'
  | 'GIFT_RECEIVED'
  | 'NEW_FOLLOWER'
  | 'FOLLOWERS_BATCH'
  | 'NEW_COMMENT'
  | 'COMMENT_REPLY'
  | 'MENTION'
  | 'PREMIUM_ACTIVATED'
  | 'PREMIUM_RENEWED'
  | 'PREMIUM_EXPIRING'
  | 'PREMIUM_CANCELED'
  | 'PAYMENT_FAILED'
  | 'VIP_MEMBER_JOINED'
  | 'VIP_CLUB_JOINED'
  | 'MILESTONE_UNLOCKED';
```

### Register Device Token

```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Register device token (done automatically on login)
await pushNotificationService.registerDeviceToken(
  userId,
  deviceToken,
  'android' // or 'ios' or 'web'
);
```

### Update Notification Preferences

```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Update preferences
await pushNotificationService.updatePreferences(userId, {
  stream_started: true,
  gift_received: true,
  new_follower: false,
  safety_moderation_alerts: true,
  admin_announcements: true,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
});
```

---

## Edge Functions

### upload-to-r2

**Endpoint**: `POST /functions/v1/upload-to-r2`

**Request**:
```json
{
  "fileName": "avatar.jpg",
  "fileType": "image/jpeg",
  "mediaType": "profile"
}
```

**Response**:
```json
{
  "success": true,
  "uploadUrl": "https://...",
  "publicUrl": "https://pub-xxx.r2.dev/profile/user-id/avatar.jpg",
  "filePath": "profile/user-id/avatar.jpg",
  "expiresIn": 3600,
  "method": "PUT",
  "headers": {
    "Content-Type": "image/jpeg"
  }
}
```

### sign-url

**Endpoint**: `POST /functions/v1/sign-url`

**Request**:
```json
{
  "path": "profile/user-id/avatar.jpg",
  "expiresIn": 600,
  "watermark": "RoastLive"
}
```

**Response**:
```json
{
  "success": true,
  "signedUrl": "https://pub-xxx.r2.dev/profile/user-id/avatar.jpg?expires=...&signature=...&watermark=...",
  "expiresAt": 1234567890,
  "expiresIn": 600
}
```

### send-push-notification

**Endpoint**: `POST /functions/v1/send-push-notification`

**Request**:
```json
{
  "userId": "user-id",
  "tokens": [
    { "token": "fcm-token", "platform": "android" }
  ],
  "notification": {
    "title": "Test Notification",
    "body": "This is a test",
    "data": {
      "route": "Home"
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1,
  "results": [
    { "token": "...", "platform": "android", "status": "sent" }
  ]
}
```

---

## Environment Variables

### Runtime (app.config.js)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
CLOUDFLARE_R2_PUBLIC_BASE_URL=https://pub-xxx.r2.dev
CLOUDFLARE_ACCOUNT_ID=xxx
SUPABASE_FUNCTIONS_URL=https://xxx.supabase.co/functions/v1
EXPO_PUBLIC_PROJECT_ID=xxx
```

### Supabase Secrets

```bash
CF_R2_ACCESS_KEY_ID=xxx
CF_R2_SECRET_ACCESS_KEY=xxx
CF_R2_BUCKET=roast-live-media
CF_API_TOKEN=xxx
CF_SIGNING_SECRET=xxx
FCM_SERVER_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Common Patterns

### Upload and Save to Database

```typescript
// Upload profile image
const uploadResult = await r2Service.uploadProfileImage(file, userId);

if (uploadResult.success) {
  // Save to database
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: uploadResult.publicUrl })
    .eq('id', userId);
    
  if (!error) {
    console.log('Profile image updated');
  }
}
```

### Send Notification on Event

```typescript
// When user receives a gift
await pushNotificationService.sendGiftReceivedNotification(
  receiverId,
  senderName,
  giftName,
  giftValue,
  giftId
);

// When user goes live
await pushNotificationService.sendLiveStreamNotification(
  streamId,
  creatorId,
  creatorName
);

// When user gets a new follower
await pushNotificationService.sendNewFollowerNotification(
  followedUserId,
  followerUserId,
  followerName
);
```

---

## Testing

### Test R2 Upload

```bash
# Using curl
curl -X POST https://xxx.supabase.co/functions/v1/upload-to-r2 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.jpg","fileType":"image/jpeg","mediaType":"profile"}'
```

### Test Push Notification

```bash
# Using curl
curl -X POST https://xxx.supabase.co/functions/v1/send-push-notification \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user-id",
    "tokens":[{"token":"fcm-token","platform":"android"}],
    "notification":{"title":"Test","body":"Test notification"}
  }'
```

---

## Troubleshooting

### R2 Upload Fails

- Check Supabase secrets are set
- Verify R2 bucket permissions
- Check Edge Function logs

### Push Notifications Not Delivered

- Verify FCM_SERVER_KEY is set
- Check device token is registered
- Ensure app is built with EAS (not Expo Go)
- Check notification preferences

### Signed URLs Expire Too Quickly

- Increase `expiresIn` parameter
- Default is 600 seconds (10 minutes)
- Maximum recommended: 3600 seconds (1 hour)

---

## Best Practices

1. **Always use R2 for static assets** (images, thumbnails, gifts)
2. **Never use R2 for live streaming** (use WebRTC instead)
3. **Set appropriate expiration times** for signed URLs
4. **Handle upload failures gracefully** with fallbacks
5. **Respect user notification preferences**
6. **Test push notifications on real devices** (not Expo Go)
7. **Monitor Edge Function logs** for errors
8. **Rotate signing secrets regularly**

