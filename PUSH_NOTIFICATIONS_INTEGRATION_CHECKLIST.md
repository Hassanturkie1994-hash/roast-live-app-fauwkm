
# Push Notifications Integration Checklist

## ✅ Completed

### Database
- [x] Created `push_device_tokens` table
- [x] Created `push_notifications_log` table
- [x] Added RLS policies for both tables
- [x] Created indexes for performance

### Services
- [x] Updated `pushNotificationService.ts` with full functionality
- [x] Integrated push notifications into `aiModerationService.ts`
- [x] Integrated push notifications into `appealsService.ts`
- [x] Integrated push notifications into `escalationService.ts`
- [x] Created `banExpirationService.ts` for automatic ban expiration notifications

### Edge Functions
- [x] Deployed `send-push-notification` edge function
- [x] Deployed `check-ban-expirations` edge function

### Client Integration
- [x] Created `usePushNotifications` hook
- [x] Integrated hook into `AuthContext` for automatic token registration on login
- [x] Installed `expo-notifications` dependency

### Documentation
- [x] Created `PUSH_NOTIFICATIONS_IMPLEMENTATION.md`
- [x] Created `PUSH_NOTIFICATIONS_QUICK_REFERENCE.md`
- [x] Created `PUSH_NOTIFICATIONS_SETUP_GUIDE.md`

## 🔄 Integration Points

### AI Moderation → Push Notifications
- [x] Message hidden (score ≥ 0.50) → `MODERATION_WARNING`
- [x] Timeout applied (score ≥ 0.70) → `TIMEOUT_APPLIED`
- [x] Ban applied (score ≥ 0.85) → `BAN_APPLIED`

### Moderator Actions → Push Notifications
- [x] Moderator timeout → `TIMEOUT_APPLIED`
- [x] Admin penalty → `BAN_APPLIED`
- [x] Ban expiration → `BAN_EXPIRED`

### Appeals Flow → Push Notifications
- [x] Appeal submitted → `APPEAL_RECEIVED`
- [x] Appeal approved → `APPEAL_APPROVED`
- [x] Appeal denied → `APPEAL_DENIED`

## 📝 TODO (Manual Setup Required)

### Firebase Configuration
- [ ] Create Firebase project
- [ ] Enable Cloud Messaging
- [ ] Get FCM Server Key
- [ ] Set FCM_SERVER_KEY in Supabase secrets

### iOS Setup (if targeting iOS)
- [ ] Create Apple Developer account
- [ ] Create App ID with Push Notifications capability
- [ ] Generate APNs certificate or key
- [ ] Upload APNs credentials to Firebase

### Expo Configuration
- [ ] Get Expo project ID from https://expo.dev/
- [ ] Set EXPO_PUBLIC_PROJECT_ID environment variable
- [ ] Add notification icon to assets
- [ ] Add notification sound to assets (optional)

### Cron Job Setup
- [ ] Set up cron job to call `check-ban-expirations` every 5 minutes
- [ ] Options:
  - Use pg_cron extension in Supabase
  - Use external cron service (Vercel Cron, GitHub Actions, etc.)

### Testing
- [ ] Test push notification registration on login
- [ ] Test AI moderation notifications
- [ ] Test moderator action notifications
- [ ] Test appeals flow notifications
- [ ] Test ban expiration notifications
- [ ] Test deep linking from notifications

## 🎯 Notification Flow Summary

### 1. AI Hides Message (score ≥ 0.50)
```
User sends message
  ↓
AI detects violation (score ≥ 0.50)
  ↓
Message hidden from others
  ↓
Push notification sent: "Your message was moderated"
  ↓
In-app notification created
  ↓
Logged in push_notifications_log
```

### 2. Moderator Applies Timeout
```
Moderator reviews flagged content
  ↓
Moderator applies timeout (5-60 minutes)
  ↓
Timeout recorded in timed_out_users_v2
  ↓
Push notification sent: "You've been timed out"
  ↓
In-app notification created
  ↓
Logged in push_notifications_log
```

### 3. User Submits Appeal
```
User submits appeal
  ↓
Appeal recorded in appeals table
  ↓
Push notification sent: "We received your appeal"
  ↓
In-app notification created
  ↓
Logged in push_notifications_log
```

### 4. Admin Reviews Appeal
```
Admin approves/denies appeal
  ↓
Appeal status updated
  ↓
Penalty deactivated (if approved)
  ↓
Push notification sent: "Your appeal was approved/denied"
  ↓
In-app notification created with deep link
  ↓
Logged in push_notifications_log
```

### 5. Ban Expires (Automatic)
```
Cron job runs every 5 minutes
  ↓
check-ban-expirations edge function called
  ↓
Expired bans detected
  ↓
Penalties/strikes deactivated
  ↓
Push notification sent: "Your restriction has ended"
  ↓
In-app notification created
  ↓
Logged in push_notifications_log
```

## 🔒 Security Considerations

1. **RLS Policies**: All tables have proper RLS policies
2. **Service Role Key**: Only edge functions use service role key
3. **Token Validation**: Invalid tokens are automatically deactivated
4. **User Permissions**: Notifications only sent to authorized users
5. **Deep Link Validation**: Validate deep link data before navigation

## 📈 Monitoring & Analytics

### Key Metrics to Track

1. **Delivery Rate**
   - Total notifications sent
   - Successful deliveries
   - Failed deliveries
   - Success rate percentage

2. **Token Health**
   - Active tokens per platform
   - Invalid token rate
   - Token registration rate

3. **Notification Types**
   - Most common notification types
   - Notification frequency per user
   - Peak notification times

### SQL Queries for Monitoring

```sql
-- Delivery success rate
SELECT 
  delivery_status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM push_notifications_log
GROUP BY delivery_status;

-- Notifications by type
SELECT 
  type,
  COUNT(*) as count
FROM push_notifications_log
GROUP BY type
ORDER BY count DESC;

-- Active tokens by platform
SELECT 
  platform,
  COUNT(*) as count
FROM push_device_tokens
WHERE is_active = true
GROUP BY platform;

-- Failed deliveries in last 24 hours
SELECT *
FROM push_notifications_log
WHERE delivery_status = 'failed'
  AND sent_at > NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;
```

## 🎨 Customization

### Custom Notification Sounds

1. Add sound file to `assets/sounds/notification.wav`
2. Update `app.json`:
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "sounds": ["./assets/sounds/notification.wav"]
           }
         ]
       ]
     }
   }
   ```

### Custom Notification Icons

1. Add icon to `assets/images/notification-icon.png`
2. Update `app.json`:
   ```json
   {
     "expo": {
       "notification": {
         "icon": "./assets/images/notification-icon.png",
         "color": "#A40028"
       }
     }
   }
   ```

## 🔄 Future Enhancements

### Planned Features
- [ ] Web push notifications support
- [ ] Rich notifications with images
- [ ] Notification actions (reply, dismiss, etc.)
- [ ] Notification grouping
- [ ] Scheduled notifications
- [ ] Notification preferences UI
- [ ] A/B testing for notification content
- [ ] Notification analytics dashboard

### Potential Integrations
- [ ] OneSignal (alternative to FCM)
- [ ] Twilio (for SMS notifications)
- [ ] SendGrid (for email notifications)
- [ ] Slack (for admin notifications)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review edge function logs
3. Check database logs
4. Verify environment variables

## 🎉 Success Criteria

Your push notification system is working correctly when:

1. ✅ Users receive notifications on their devices
2. ✅ Notifications appear in the in-app inbox
3. ✅ Deep links navigate to correct screens
4. ✅ Expired bans trigger automatic notifications
5. ✅ Invalid tokens are automatically deactivated
6. ✅ All notifications are logged with delivery status
7. ✅ No livestream logic is affected

## 📝 Notes

- **No Livestream Logic Modified**: All push notification functionality is completely separate from livestream APIs, Cloudflare integration, and start/stop live logic.
- **Dual Notification System**: Every push notification also creates an in-app notification.
- **Automatic Token Management**: Invalid tokens are automatically deactivated.
- **Deep Linking Support**: Notifications include payload data for deep linking.
- **Delivery Tracking**: All notifications are logged with delivery status.
