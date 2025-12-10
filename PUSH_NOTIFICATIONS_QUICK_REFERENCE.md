
# Push Notifications Quick Reference

## 🚀 Quick Start

### Send a Push Notification
```typescript
import { pushNotificationService } from '@/app/services/pushNotificationService';

await pushNotificationService.sendPushNotification(
  userId,
  'MODERATION_WARNING',
  'Your message was moderated',
  'One of your messages was hidden for breaking the rules.',
  { stream_id: 'abc123' }
);
```

### Register Device Token (Auto-handled on login)
```typescript
await pushNotificationService.registerDeviceToken(
  userId,
  deviceToken,
  'ios' // or 'android' or 'web'
);
```

## 📋 Notification Types

### Safety & Moderation
- `MODERATION_WARNING` - Message moderated by AI
- `TIMEOUT_APPLIED` - User timed out
- `BAN_APPLIED` - User banned
- `BAN_EXPIRED` - Ban/restriction expired
- `SAFETY_REMINDER` - Safety reminder

### Appeals
- `APPEAL_RECEIVED` - Appeal submitted
- `APPEAL_APPROVED` - Appeal approved
- `APPEAL_DENIED` - Appeal denied

### General
- `SYSTEM_WARNING` - System warning
- `ADMIN_ANNOUNCEMENT` - Admin announcement

## 🔗 Integration Points

### AI Moderation
When AI hides a message (score ≥ 0.50):
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'MODERATION_WARNING',
  'Your message was moderated',
  'One of your messages was hidden for breaking the rules.'
);
```

### Moderator Actions
When moderator applies timeout:
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'TIMEOUT_APPLIED',
  'You\'ve been timed out',
  `You cannot participate in chat for ${minutes} minutes.`,
  { duration_minutes: minutes }
);
```

### Appeals Flow
When user submits appeal:
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'APPEAL_RECEIVED',
  'We received your appeal',
  'Our team will review your case.'
);
```

When admin approves appeal:
```typescript
await pushNotificationService.sendPushNotification(
  userId,
  'APPEAL_APPROVED',
  'Your appeal was approved',
  'A penalty has been removed.',
  { route: 'AppealDetails', appealId }
);
```

## 🗄️ Database Tables

### push_device_tokens
Stores device tokens for push notifications.

### push_notifications_log
Logs all push notifications sent with delivery status.

## 🔧 Edge Functions

### send-push-notification
Sends push notifications via FCM/APNs.

**Deploy:**
```bash
supabase functions deploy send-push-notification
```

### check-ban-expirations
Checks for expired bans and sends notifications.

**Deploy:**
```bash
supabase functions deploy check-ban-expirations
```

**Set up cron job (run every 5 minutes):**
```sql
SELECT cron.schedule(
  'check-ban-expirations',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/check-ban-expirations',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## 🔑 Environment Variables

Set in Supabase Edge Function secrets:

```bash
supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here
```

## 📱 Client Setup

### Configure Expo Notifications
In `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#A40028",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ]
  }
}
```

### Handle Deep Links
```typescript
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  if (data.route === 'AppealDetails') {
    navigation.navigate('AppealDetails', { appealId: data.appealId });
  }
});
```

## ✅ Testing

### Test Notification
```typescript
await pushNotificationService.sendPushNotification(
  'user-id',
  'SYSTEM_WARNING',
  'Test',
  'This is a test notification.',
  { test: true }
);
```

### Check Logs
```typescript
const logs = await pushNotificationService.getPushNotificationLogs(userId);
console.log('Notification logs:', logs);
```

### Verify Tokens
```typescript
const tokens = await pushNotificationService.getActiveDeviceTokens(userId);
console.log('Active tokens:', tokens);
```

## 🐛 Troubleshooting

### No notifications received?
1. Check device token is registered
2. Check notification logs for delivery status
3. Verify FCM_SERVER_KEY is set
4. Check edge function logs

### Invalid token errors?
- Tokens are auto-deactivated when invalid
- User needs to re-login to register new token

### Notifications not appearing in app?
- Check in-app notifications table
- All push notifications also create in-app notifications

## 📊 Monitoring

### View Push Notification Stats
```typescript
const logs = await pushNotificationService.getAllPushNotificationLogs({
  deliveryStatus: 'failed',
  limit: 100
});
```

### Check Failed Deliveries
```typescript
const failed = logs.filter(log => log.delivery_status === 'failed');
console.log(`Failed deliveries: ${failed.length}`);
```
