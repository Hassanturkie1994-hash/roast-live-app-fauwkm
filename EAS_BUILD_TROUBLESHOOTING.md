
# EAS Build Troubleshooting Guide

## 🔧 Common Build Issues & Solutions

### Issue 1: "No project ID found"

**Error Message:**
```
Error: No "projectId" found. If "projectId" can't be inferred from the manifest...
```

**Solution:**
```bash
# Run EAS init to create/link project
eas init

# This will update app.json with your project ID
```

**Verify:**
Check `app.json` has:
```json
"extra": {
  "eas": {
    "projectId": "your-actual-project-id"
  }
}
```

---

### Issue 2: "react-native-nodemediaclient not found"

**Error Message:**
```
error: cannot find symbol
import cn.nodemediaclient.RCTNodeMediaClientPackage;
```

**Solution:**
Already fixed! Verify `app.json` has:
```json
"autolinking": {
  "exclude": ["react-native-nodemediaclient"]
}
```

**If still failing:**
```bash
# Clean and rebuild
npx expo prebuild --clean
eas build --clear-cache -p android
```

---

### Issue 3: "WebRTC not working"

**Symptoms:**
- Stream doesn't start
- Camera shows but no broadcast
- "WebRTC not available" error

**Solutions:**

1. **Verify you're using native build:**
   ```bash
   # NOT Expo Go - must be development build
   eas build -p android --profile development
   ```

2. **Check permissions:**
   - Android: Settings → Apps → Roast Live → Permissions
   - iOS: Settings → Roast Live → Permissions

3. **Verify react-native-webrtc installed:**
   ```bash
   npm list react-native-webrtc
   # Should show: react-native-webrtc@124.0.7
   ```

4. **Check logs:**
   ```javascript
   // In WebRTCLivePublisher.tsx
   console.log('WebRTC available:', !!RTCPeerConnection);
   ```

---

### Issue 4: "Build takes forever"

**Symptoms:**
- Build stuck at "Building..."
- Build time > 30 minutes

**Solutions:**

1. **Use development profile:**
   ```bash
   # Faster than production builds
   eas build -p android --profile development
   ```

2. **Clear cache (first time only):**
   ```bash
   eas build --clear-cache -p android
   ```

3. **Check EAS status:**
   - Visit https://status.expo.dev
   - Check for service issues

4. **Use local builds (advanced):**
   ```bash
   eas build --local -p android
   ```

---

### Issue 5: "Permissions denied at runtime"

**Symptoms:**
- Camera permission popup doesn't appear
- "Permission denied" errors
- Features don't work

**Solutions:**

1. **Verify permissions in config:**
   Check `app.json` has all permissions listed

2. **Reinstall app:**
   ```bash
   # Uninstall from device
   # Reinstall fresh APK/IPA
   ```

3. **Manually grant permissions:**
   - Android: Settings → Apps → Roast Live → Permissions → Enable all
   - iOS: Settings → Roast Live → Enable all

4. **Check permission descriptions:**
   Ensure `app.json` has proper descriptions:
   ```json
   "ios": {
     "infoPlist": {
       "NSCameraUsageDescription": "Allow Roast Live to access your camera...",
       "NSMicrophoneUsageDescription": "Allow Roast Live to access your microphone..."
     }
   }
   ```

---

### Issue 6: "Gift animations not smooth"

**Symptoms:**
- Animations lag or stutter
- Animations don't play
- Performance issues

**Solutions:**

1. **Verify Reanimated plugin order:**
   Check `babel.config.js` has Reanimated plugin LAST:
   ```javascript
   plugins: [
     // ... other plugins
     "react-native-reanimated/plugin", // MUST BE LAST
   ]
   ```

2. **Clear cache and rebuild:**
   ```bash
   npx expo start --clear
   eas build --clear-cache -p android
   ```

3. **Check native driver usage:**
   Ensure animations use `useNativeDriver: true`

4. **Test on real device:**
   Animations may be slow on emulator/simulator

---

### Issue 7: "App crashes on launch"

**Symptoms:**
- App opens then immediately closes
- White screen then crash
- No error message

**Solutions:**

1. **Check device logs:**
   ```bash
   # Android
   adb logcat | grep -i "roast"
   
   # iOS
   # Use Xcode → Devices → View Device Logs
   ```

2. **Verify all dependencies installed:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check for missing native modules:**
   ```bash
   npx expo prebuild --clean
   ```

4. **Test development build:**
   ```bash
   # Development builds have better error messages
   eas build -p android --profile development
   ```

---

### Issue 8: "Camera shows black screen"

**Symptoms:**
- Camera permission granted
- Black screen instead of camera feed
- No error message

**Solutions:**

1. **Check camera permission:**
   - Verify permission actually granted in device settings

2. **Try switching camera:**
   - Toggle front/back camera
   - May fix initialization issue

3. **Restart app:**
   - Close and reopen app
   - Camera may need reinitialization

4. **Check for conflicts:**
   ```javascript
   // Only one CameraView should be active
   // Check for multiple camera instances
   ```

---

### Issue 9: "Push notifications not working"

**Symptoms:**
- No notification permission prompt
- Notifications not received
- Token registration fails

**Solutions:**

1. **Verify expo-notifications configured:**
   Check `app.json` has notifications plugin

2. **Check device settings:**
   - Ensure notifications enabled for app
   - Check Do Not Disturb mode

3. **Test with Expo push tool:**
   ```bash
   # Get push token from app logs
   # Test at https://expo.dev/notifications
   ```

4. **Verify Firebase setup (Android):**
   - Check google-services.json present
   - Verify FCM server key in Supabase

---

### Issue 10: "Build succeeds but features missing"

**Symptoms:**
- Build completes successfully
- Some features don't work
- No obvious errors

**Solutions:**

1. **Verify using correct build:**
   - NOT Expo Go
   - Must be development/preview/production build

2. **Check feature availability:**
   ```javascript
   // Log feature availability
   console.log('WebRTC:', !!RTCPeerConnection);
   console.log('Camera:', !!CameraView);
   console.log('Notifications:', !!Notifications);
   ```

3. **Verify native modules linked:**
   ```bash
   # Check android/app/build.gradle
   # Check ios/Podfile
   ```

4. **Rebuild with clean cache:**
   ```bash
   npx expo prebuild --clean
   eas build --clear-cache -p android
   ```

---

## 🔍 Debugging Techniques

### 1. Check Build Logs
```bash
# View latest build
eas build:list

# View specific build logs
eas build:view [build-id]
```

### 2. Check Device Logs

**Android:**
```bash
# Connect device via USB
adb logcat | grep -i "roast"

# Or filter by package
adb logcat | grep "com.roastlive.roastlive"
```

**iOS:**
```bash
# Use Xcode
# Window → Devices and Simulators
# Select device → View Device Logs
```

### 3. Test in Development Mode
```bash
# Development builds have better error messages
eas build -p android --profile development
```

### 4. Inspect Native Projects
```bash
# Generate native projects locally
npx expo prebuild --clean

# Check android/app/src/main/AndroidManifest.xml
# Check ios/[AppName]/Info.plist
```

### 5. Use Console Logs
```javascript
// Add strategic console.logs
console.log('Feature initialized:', featureName);
console.log('Permission status:', permissionStatus);
console.log('WebRTC available:', !!RTCPeerConnection);
```

---

## 🆘 When All Else Fails

### 1. Clean Everything
```bash
# Remove all generated files
rm -rf node_modules
rm -rf android
rm -rf ios
rm -rf .expo

# Reinstall
npm install

# Rebuild
npx expo prebuild --clean
eas build --clear-cache -p android
```

### 2. Check Expo Status
- Visit https://status.expo.dev
- Check for ongoing issues

### 3. Update Dependencies
```bash
# Update Expo SDK
npx expo install --fix

# Update EAS CLI
npm install -g eas-cli@latest
```

### 4. Check Documentation
- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [react-native-webrtc Docs](https://github.com/react-native-webrtc/react-native-webrtc)
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/)

### 5. Ask for Help
- Expo Discord: https://chat.expo.dev
- Expo Forums: https://forums.expo.dev
- Stack Overflow: Tag with `expo` and `eas`

---

## 📊 Build Status Meanings

### "Pending"
- Build queued, waiting for resources
- Normal, just wait

### "In Progress"
- Build actively running
- Check logs for progress

### "Finished"
- ✅ Build successful
- Download APK/IPA

### "Failed"
- ❌ Build failed
- Check logs for errors

### "Canceled"
- Build manually canceled
- Can restart if needed

---

## ✅ Verification Steps

After fixing any issue:

1. **Clean build:**
   ```bash
   eas build --clear-cache -p android
   ```

2. **Install fresh:**
   - Uninstall old version
   - Install new APK/IPA

3. **Test thoroughly:**
   - Grant all permissions
   - Test each feature
   - Check logs for errors

4. **Monitor performance:**
   - Check CPU usage
   - Check memory usage
   - Check battery drain

---

## 📞 Quick Reference

```bash
# Clean everything
rm -rf node_modules android ios .expo && npm install

# Rebuild native projects
npx expo prebuild --clean

# Build with clean cache
eas build --clear-cache -p android --profile development

# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Check device logs (Android)
adb logcat | grep -i "roast"
```

---

**Remember:** Most issues are resolved by:
1. Cleaning caches
2. Reinstalling dependencies
3. Rebuilding with clean cache
4. Testing on real device (not emulator)
