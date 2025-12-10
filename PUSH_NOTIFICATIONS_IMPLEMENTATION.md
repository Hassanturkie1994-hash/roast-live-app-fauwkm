
# Push Notifications Implementation Summary

## Overview
This document outlines the complete push notification infrastructure implemented for Roast Live, including device token management, notification types, and integration with AI moderation, moderator actions, and appeals flow.

## Database Tables

### 1. push_device_tokens
Stores device tokens for push notifications.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `platform` (ENUM: 'ios', 'android', 'web')
- `device_token` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `last_used_at` (TIMESTAMPTZ)
- `is_active` (BOOLEAN)

**Unique Constraint:** `(user_id, device_token)`

**RLS Policies:**
- Users can view/insert/update/delete their own device tokens

### 2. push_notifications_log
Logs all push notifications sent.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK to profiles)
- `type` (TEXT, CHECK constraint for notification types)
- `title` (TEXT)
- `body` (TEXT)
- `payload_json` (JSONB)
- `sent_at` (TIMESTAMPTZ)
- `delivery_status` (TEXT: 'pending', 'sent', 'failed')

**RLS Policies:**
- Users can view their own push notifications
- Admins can view all push notifications

## Notification Types

The following notification types are supported:

### Safety & Moderation
- `SYSTEM_WARNING` - System-level warnings
- `MODERATION_WARNING` - AI/moderator message moderation
- `TIMEOUT_APPLIED` - User timeout applied
- `BAN_APPLIED` - User banned from stream/platform
- `BAN_EXPIRED` - Ban/restriction expired

### Appeals
- `APPEAL_RECEIVED` - Appeal submitted confirmation
- `APPEAL_APPROVED` - Appeal approved by admin
- `APPEAL_DENIED` - Appeal denied by admin

### General
- `ADMIN_ANNOUNCEMENT` - Admin announcements
- `SAFETY_REMINDER` - Safety reminders
- `stream_started` - Followed creator went live
- `gift_received` - Received a gift
- `new_follower` - New follower
- `new_message` - New direct message

## Core Service: pushNotificationService

### Key Methods

#### 1. registerDeviceToken(userId, deviceToken, platform)
Registers or updates a device token for push notifications.
- Marks previous tokens for the same device as inactive
- Inserts or updates the new token

#### 2. sendPushNotification(userId, type, title, body, payload)
**Main push notification sender** - wraps all push notification logic:
1. Logs the notification in `push_notifications_log`
2. Creates an in-app notification in the `notifications` table
3. Sends the actual push notification via FCM/APNs (via edge function)

#### 3. getActiveDeviceTokens(userId)
Retrieves all active device tokens for a user.

#### 4. deactivateDeviceToken(userId, deviceToken)
Deactivates a specific device token.

#### 5. getPushNotificationLogs(userId, limit)
Gets push notification logs for a user.

## Integration Points

### 1. AI Moderation (aiModerationService)

**When AI hides a message (score ≥ 0.50):**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'MODERATION_WARNING',
  'Your message was moderated',
  'One of your messages was hidden for breaking the rules.',
  { stream_id, post_id, story_id }
);
```

**When AI applies timeout (score ≥ 0.70):**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'TIMEOUT_APPLIED',
  'You\'ve been timed out',
  'You cannot participate in chat for 2 minutes due to rule violations.',
  { stream_id, duration_minutes: 2 }
);
```

**When AI bans user (score ≥ 0.85):**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'BAN_APPLIED',
  'You were banned from a livestream',
  'You can no longer join this creator\'s lives due to repeated violations.',
  { stream_id }
);
```

### 2. Moderator Actions (escalationService)

**When moderator applies timeout:**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'TIMEOUT_APPLIED',
  'You\'ve been timed out',
  `You cannot participate in chat for ${durationMinutes} minutes due to rule violations.`,
  { stream_id, duration_minutes, moderator_name }
);
```

**When admin applies penalty:**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'BAN_APPLIED',
  'Administrative Action',
  `Your account has received an administrative action${durationText}. Reason: ${reason}`,
  { penalty_id, severity, duration_hours }
);
```

**When ban expires:**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'BAN_EXPIRED',
  'Your restriction has ended',
  'You can now interact again. Please follow the community rules.',
  { penalty_id }
);
```

### 3. Appeals Flow (appealsService)

**When user submits appeal:**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'APPEAL_RECEIVED',
  'We received your appeal',
  'Our team will review your case and notify you when it\'s resolved.',
  { penalty_id }
);
```

**When admin approves appeal:**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'APPEAL_APPROVED',
  'Your appeal was approved',
  'A penalty on your account has been removed. Check details in your Notifications.',
  { route: 'AppealDetails', appealId, penalty_id }
);
```

**When admin denies appeal:**
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'APPEAL_DENIED',
  'Your appeal was denied',
  'The original decision stands. See more details in your Notifications.',
  { route: 'AppealDetails', appealId }
);
```

## Edge Function: send-push-notification

Located at: `supabase/functions/send-push-notification/index.ts`

### Purpose
Handles the actual sending of push notifications via FCM (Firebase Cloud Messaging) for iOS and Android devices.

### Request Format
```typescript
{
  userId: string;
  tokens: { token: string; platform: 'ios' | 'android' | 'web' }[];
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };
}
```

### Response Format
```typescript
{
  success: boolean;
  sent: number;
  failed: number;
  results: Array<{
    token: string;
    platform: string;
    status: 'sent' | 'failed' | 'skipped';
    error?: any;
  }>;
}
```

### Features
- Sends push notifications via FCM for iOS and Android
- Automatically deactivates invalid/expired tokens
- Handles errors gracefully
- Returns detailed results for each device

### Environment Variables Required
- `FCM_SERVER_KEY` - Firebase Cloud Messaging server key

## Setup Instructions

### 1. Database Migration
The migration has been applied automatically. It creates:
- `push_device_tokens` table
- `push_notifications_log` table
- RLS policies
- Indexes for performance

### 2. Configure FCM
1. Create a Firebase project at https://console.firebase.google.com/
2. Get your FCM Server Key from Project Settings > Cloud Messaging
3. Add the FCM Server Key to Supabase Edge Function secrets:
   ```bash
   supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here
   ```

### 3. Deploy Edge Function
The edge function `send-push-notification` has been created and needs to be deployed:
```bash
supabase functions deploy send-push-notification
```

### 4. Client-Side Integration

#### Register Device Token on Login
```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';
import * as Notifications from 'expo-notifications';

// Request permission and get token
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  
  // Register token
  await pushNotificationService.registerDeviceToken(
    userId,
    token,
    Platform.OS === 'ios' ? 'ios' : 'android'
  );
}
```

#### Handle Incoming Notifications
```typescript
Notifications.addNotificationReceivedListener(notification => {
  console.log('Notification received:', notification);
});

Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  // Handle deep linking
  if (data.route === 'AppealDetails') {
    navigation.navigate('AppealDetails', { appealId: data.appealId });
  }
});
```

## Testing

### Test Push Notification Sending
```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Send a test notification
await pushNotificationService.sendPushNotification(
  'user-id-here',
  'SYSTEM_WARNING',
  'Test Notification',
  'This is a test push notification.',
  { test: true }
);
```

### Check Notification Logs
```typescript
// Get user's push notification logs
const logs = await pushNotificationService.getPushNotificationLogs(userId, 50);
console.log('Push notification logs:', logs);
```

### Verify Device Tokens
```typescript
// Get active device tokens
const tokens = await pushNotificationService.getActiveDeviceTokens(userId);
console.log('Active device tokens:', tokens);
```

## Important Notes

1. **No Livestream Logic Modified**: All push notification functionality is completely separate from livestream APIs, Cloudflare integration, and start/stop live logic.

2. **Dual Notification System**: Every push notification also creates an in-app notification in the `notifications` table, ensuring users can see notifications even if push is disabled.

3. **Automatic Token Management**: Invalid or expired tokens are automatically deactivated when FCM returns an error.

4. **Deep Linking**: Push notifications include payload data that can be used for deep linking to specific screens (e.g., Appeals Center).

5. **Delivery Status Tracking**: All push notifications are logged with their delivery status ('pending', 'sent', 'failed') for debugging and analytics.

6. **RLS Security**: Row Level Security policies ensure users can only access their own device tokens and notification logs.

## Future Enhancements

1. **Web Push Notifications**: Implement Web Push API for web platform support
2. **APNs Direct Integration**: Add direct APNs integration for iOS (currently using FCM)
3. **Notification Preferences**: Allow users to customize which notification types they want to receive
4. **Scheduled Notifications**: Add support for scheduled/delayed notifications
5. **Rich Notifications**: Support for images, actions, and other rich notification features
6. **Analytics Dashboard**: Admin dashboard to view push notification metrics and delivery rates

## Troubleshooting

### Push Notifications Not Received
1. Check if device token is registered: `getActiveDeviceTokens(userId)`
2. Check notification logs: `getPushNotificationLogs(userId)`
3. Verify FCM_SERVER_KEY is set correctly in Supabase secrets
4. Check edge function logs: `supabase functions logs send-push-notification`

### Invalid Token Errors
- Tokens are automatically deactivated when FCM returns invalid/not registered errors
- User needs to re-register their device token on next login

### Delivery Status Always 'pending'
- Check if edge function is deployed and accessible
- Verify FCM_SERVER_KEY environment variable is set
- Check edge function logs for errors

## API Reference

### pushNotificationService

#### registerDeviceToken(userId, deviceToken, platform)
- **userId**: string - User ID
- **deviceToken**: string - Device push token
- **platform**: 'ios' | 'android' | 'web' - Device platform
- **Returns**: `{ success: boolean; error?: string }`

#### sendPushNotification(userId, type, title, body, payload?)
- **userId**: string - User ID
- **type**: PushNotificationType - Notification type
- **title**: string - Notification title
- **body**: string - Notification body
- **payload**: Record<string, any> - Optional payload data
- **Returns**: `{ success: boolean; error?: string }`

#### getActiveDeviceTokens(userId)
- **userId**: string - User ID
- **Returns**: `PushDeviceToken[]`

#### deactivateDeviceToken(userId, deviceToken)
- **userId**: string - User ID
- **deviceToken**: string - Device push token
- **Returns**: `{ success: boolean; error?: string }`

#### getPushNotificationLogs(userId, limit?)
- **userId**: string - User ID
- **limit**: number - Optional limit (default: 50)
- **Returns**: `PushNotificationLog[]`

## Conclusion

The push notification infrastructure is now fully implemented and integrated with:
- ✅ AI moderation system (message hiding, timeouts, bans)
- ✅ Moderator actions (timeouts, bans)
- ✅ Admin penalties (temporary/permanent bans)
- ✅ Appeals flow (submission, approval, denial)
- ✅ Ban expiration notifications

All notifications are logged, tracked, and mirrored in the in-app notification system. The system is secure, scalable, and ready for production use.
