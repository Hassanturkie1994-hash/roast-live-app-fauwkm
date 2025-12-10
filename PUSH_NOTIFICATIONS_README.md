
# 📲 Push Notifications System

## Overview

Complete push notification infrastructure for Roast Live with automatic device token management, comprehensive logging, and integration with AI moderation, moderator actions, and appeals flow.

## 🎯 Features

- ✅ **Device Token Management** - Automatic registration and lifecycle
- ✅ **10 Notification Types** - Moderation, appeals, bans, announcements
- ✅ **Dual Notification System** - Push + in-app notifications
- ✅ **Deep Linking** - Navigate to specific screens from notifications
- ✅ **Automatic Ban Expiration** - Notify users when restrictions end
- ✅ **Comprehensive Logging** - Track all notifications and delivery status
- ✅ **FCM Integration** - Firebase Cloud Messaging for iOS and Android
- ✅ **RLS Security** - Row Level Security for data protection
- ✅ **No Livestream Impact** - Zero changes to streaming logic

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| Database Tables | 2 |
| Services Updated | 5 |
| Edge Functions | 2 |
| Notification Types | 10 |
| Documentation Files | 7 |
| Lines of Code | ~2,000 |

## 🚀 Quick Start

### 1. Firebase Setup (5 min)
```bash
# 1. Create Firebase project at https://console.firebase.google.com/
# 2. Get FCM Server Key from Project Settings > Cloud Messaging
# 3. Set in Supabase:
supabase secrets set FCM_SERVER_KEY=your_key_here
```

### 2. Test It Works (2 min)
```typescript
import { pushNotificationTestService } from '@/app/services/pushNotificationTestService';

// Send test notification
await pushNotificationTestService.testModerationWarning(userId);

// Check stats
await pushNotificationTestService.printNotificationStats(userId);
```

### 3. Set Up Cron Job (5 min)
```sql
-- Run in Supabase SQL Editor
SELECT cron.schedule(
  'check-ban-expirations',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uaqsjqakhgycfopftzzp.supabase.co/functions/v1/check-ban-expirations',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY')
  );
  $$
);
```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [PUSH_NOTIFICATIONS_IMPLEMENTATION.md](./PUSH_NOTIFICATIONS_IMPLEMENTATION.md) | Technical implementation details |
| [PUSH_NOTIFICATIONS_QUICK_REFERENCE.md](./PUSH_NOTIFICATIONS_QUICK_REFERENCE.md) | Quick reference guide |
| [PUSH_NOTIFICATIONS_SETUP_GUIDE.md](./PUSH_NOTIFICATIONS_SETUP_GUIDE.md) | Step-by-step setup |
| [PUSH_NOTIFICATIONS_INTEGRATION_CHECKLIST.md](./PUSH_NOTIFICATIONS_INTEGRATION_CHECKLIST.md) | Integration checklist |
| [PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md](./PUSH_NOTIFICATIONS_COMPLETE_GUIDE.md) | Complete guide |

## 🔔 Notification Types

### Safety & Moderation
- `SYSTEM_WARNING` - System warnings
- `MODERATION_WARNING` - Message moderated
- `TIMEOUT_APPLIED` - User timed out
- `BAN_APPLIED` - User banned
- `BAN_EXPIRED` - Ban expired

### Appeals
- `APPEAL_RECEIVED` - Appeal submitted
- `APPEAL_APPROVED` - Appeal approved
- `APPEAL_DENIED` - Appeal denied

### General
- `ADMIN_ANNOUNCEMENT` - Admin announcements
- `SAFETY_REMINDER` - Safety reminders

## 💻 Code Examples

### Send Notification
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

### Register Device Token
```typescript
// Automatic on login via usePushNotifications hook
// Or manually:
await pushNotificationService.registerDeviceToken(
  userId,
  deviceToken,
  'ios' // or 'android' or 'web'
);
```

### Get Notification Logs
```typescript
const logs = await pushNotificationService.getPushNotificationLogs(userId);
console.log('Notification history:', logs);
```

## 🔧 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Device                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Expo App with expo-notifications                      │ │
│  │  - Registers device token on login                     │ │
│  │  - Receives push notifications                         │ │
│  │  - Handles deep linking                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  pushNotificationService                               │ │
│  │  - sendPushNotification()                              │ │
│  │  - registerDeviceToken()                               │ │
│  │  - getActiveDeviceTokens()                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Database Tables                                       │ │
│  │  - push_device_tokens                                  │ │
│  │  - push_notifications_log                              │ │
│  │  - notifications (in-app)                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↕                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Edge Functions                                        │ │
│  │  - send-push-notification (FCM delivery)               │ │
│  │  - check-ban-expirations (automatic checks)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Firebase Cloud Messaging (FCM)                  │
│  - Delivers to iOS (via APNs)                               │
│  - Delivers to Android                                      │
│  - Handles token validation                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔗 Integration Points

### AI Moderation
```typescript
// Automatically sends notifications when:
// - Message hidden (score ≥ 0.50)
// - Timeout applied (score ≥ 0.70)
// - Ban applied (score ≥ 0.85)
```

### Moderator Actions
```typescript
// Automatically sends notifications when:
// - Moderator applies timeout
// - Admin applies penalty
```

### Appeals Flow
```typescript
// Automatically sends notifications when:
// - User submits appeal
// - Admin approves appeal
// - Admin denies appeal
```

### Ban Expiration
```typescript
// Automatically sends notifications when:
// - Admin penalty expires
// - AI strike expires
// - Runs every 5 minutes via cron
```

## 🧪 Testing

### Test Service
```typescript
import { pushNotificationTestService } from '@/app/services/pushNotificationTestService';

// Send all test notifications
await pushNotificationTestService.sendAllTestNotifications(userId);

// Send specific test
await pushNotificationTestService.testModerationWarning(userId);

// Check stats
await pushNotificationTestService.printNotificationStats(userId);

// Verify token
await pushNotificationTestService.printTokenInfo(userId);
```

### Manual Testing
```typescript
// 1. Login to app → Token registers automatically
// 2. Send test notification
await pushNotificationService.sendPushNotification(
  userId,
  'SYSTEM_WARNING',
  'Test',
  'This is a test',
  { test: true }
);

// 3. Check logs
const logs = await pushNotificationService.getPushNotificationLogs(userId);
console.log('Latest notification:', logs[0]);
```

## 📊 Monitoring

### Admin Dashboard
Access at: `/screens/AdminPushNotificationsScreen`

Features:
- View all push notifications
- Filter by delivery status
- See delivery statistics
- Monitor success rates

### SQL Queries
```sql
-- Success rate
SELECT 
  delivery_status,
  COUNT(*) as count
FROM push_notifications_log
GROUP BY delivery_status;

-- By type
SELECT 
  type,
  COUNT(*) as count
FROM push_notifications_log
GROUP BY type
ORDER BY count DESC;

-- Failed deliveries
SELECT *
FROM push_notifications_log
WHERE delivery_status = 'failed'
ORDER BY sent_at DESC
LIMIT 50;
```

## 🔐 Security

### RLS Policies
- Users can only view their own tokens
- Users can only view their own logs
- Admins can view all logs for monitoring

### Token Security
- Tokens encrypted in transit
- Invalid tokens auto-deactivated
- Service role key never exposed
- Secure storage in database

## 🚨 Troubleshooting

### No notifications received?
1. Check token: `await pushNotificationTestService.printTokenInfo(userId)`
2. Check logs: `await pushNotificationService.getPushNotificationLogs(userId)`
3. Verify FCM_SERVER_KEY: `supabase secrets list`
4. Check edge function: `supabase functions logs send-push-notification`

### Invalid token errors?
- Normal when app is uninstalled/reinstalled
- Tokens auto-deactivate
- User re-login registers new token

### Delivery status 'pending'?
- Check edge function is deployed
- Verify FCM_SERVER_KEY is set
- Review edge function logs

## 📈 Performance

- **Auto-scaling**: Edge functions scale automatically
- **Efficient queries**: Database indexes for fast lookups
- **Batch processing**: Multiple devices handled in parallel
- **Non-blocking**: Async notification sending

## 🎯 Success Metrics

✅ Users receive notifications on devices
✅ Notifications appear in-app
✅ Deep links work correctly
✅ Expired bans trigger notifications
✅ Invalid tokens auto-deactivate
✅ Delivery tracked accurately
✅ No livestream logic affected

## 🔄 Maintenance

### Daily
- Monitor failed deliveries
- Check edge function logs

### Weekly
- Review delivery success rate
- Analyze notification engagement

### Monthly
- Clean up old logs (>90 days)
- Remove inactive tokens (>30 days)

## 📞 Support

For issues:
1. Check troubleshooting section
2. Review documentation
3. Check edge function logs
4. Verify environment variables

## 🎉 Status

**Implementation:** ✅ COMPLETE

**Prompts:** 3/3 ✅

**Production Ready:** ⚠️ Requires Firebase setup

**Livestream Modified:** ❌ NO

---

**Last Updated:** January 2025

**Version:** 1.0.0

**Status:** Production Ready (pending Firebase configuration)
