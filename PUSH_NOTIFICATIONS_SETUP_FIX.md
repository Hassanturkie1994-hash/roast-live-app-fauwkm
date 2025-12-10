
# Push Notifications Setup Fix

## Issue
The error "No projectId found" occurs because Expo needs a project ID to send push notifications.

## Solution

### Step 1: Get Your Expo Project ID

1. Go to [https://expo.dev/](https://expo.dev/)
2. Sign in or create an account
3. Create a new project or select your existing project
4. Copy your Project ID (it looks like: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### Step 2: Add Project ID to app.json

Open `app.json` and replace `"your-expo-project-id-here"` with your actual project ID:

```json
{
  "expo": {
    ...
    "extra": {
      "router": {},
      "eas": {
        "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    }
  }
}
```

### Step 3: Important Notes

#### For Development Testing

**Expo Go Limitations (SDK 53+):**
- ❌ Android push notifications are **NOT supported** in Expo Go
- ✅ iOS push notifications work in Expo Go
- ✅ Both platforms work in **development builds**

**Recommended Approach:**
Use a development build instead of Expo Go for testing push notifications:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build development version
eas build --profile development --platform android
eas build --profile development --platform ios
```

#### Fallback Behavior

The code now includes smart fallback logic:

1. **First attempt**: Get Expo push token with projectId
2. **If projectId missing**: Warn and fall back to device token
3. **If Expo token fails**: Fall back to device token
4. **If in Expo Go on Android**: Skip registration with helpful message

### Step 4: Testing

After adding your project ID:

1. Restart your development server
2. Clear the app cache: `expo start -c`
3. Test on a real device (not simulator for push notifications)
4. Check console logs for success messages

### Expected Console Output

✅ **Success:**
```
✅ Push notification token registered successfully
```

⚠️ **Warning (missing projectId):**
```
⚠️ No projectId found in app.json. Please add it under extra.eas.projectId
Falling back to device push token...
✅ Using device push token as fallback
```

❌ **Expo Go Android (SDK 53+):**
```
⚠️ Push notifications are not supported in Expo Go on Android (SDK 53+)
Please use a development build for push notification testing
```

## Additional Resources

- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

## Quick Reference

### Get Project ID
```bash
# Via EAS CLI
eas project:info
```

### Test Push Notifications
```bash
# Send test notification via Expo
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "Test",
    "body": "This is a test notification"
  }'
```

## Troubleshooting

### Issue: Still getting "No projectId" error
- Make sure you restarted the dev server after updating app.json
- Clear cache: `expo start -c`
- Verify the projectId is in the correct location in app.json

### Issue: Notifications not received
- Check device notification permissions
- Verify you're not in Expo Go on Android (SDK 53+)
- Check Supabase edge function logs
- Verify device token was registered in database

### Issue: "Invalid credentials" error
- Run `eas login` to authenticate
- Verify your Expo account has access to the project
