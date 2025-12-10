
# EAS Build Setup Guide - Roast Live

This guide will help you build your Roast Live app with full native support for WebRTC, camera features, gift animations, and multi-guest streaming.

## ✅ What's Been Configured

### 1. **WebRTC Support** ✓
- ✅ `react-native-webrtc` installed and configured
- ✅ Native modules will compile on Android + iOS
- ✅ WebRTCLivePublisher component updated to use native WebRTC
- ✅ Fallback to camera preview if WebRTC unavailable

### 2. **Camera Support** ✓
- ✅ `expo-camera` configured with proper permissions
- ✅ Flash, front/back switch, filters supported
- ✅ Stable vertical orientation (9:16 aspect ratio)
- ✅ 1080p video quality targeting

### 3. **Gift Overlay Engine** ✓
- ✅ `react-native-reanimated` properly configured
- ✅ `lottie-react-native` installed for advanced animations
- ✅ Gift animations use native Animated API
- ✅ All animation modules registered in babel.config.js

### 4. **Multi-Guest Streaming Components** ✓
- ✅ Layout components included in prebuild config
- ✅ Video containers configured
- ✅ Native video views supported
- ✅ Cloudflare publisher logic untouched

### 5. **Native Build Configuration** ✓
- ✅ All necessary plugins added to app.json
- ✅ Autolinking configured (react-native-nodemediaclient excluded)
- ✅ No missing native code dependencies
- ✅ Compatible with Expo Prebuild/EAS

### 6. **Permissions** ✓

**Android (AndroidManifest.xml):**
- ✅ CAMERA
- ✅ RECORD_AUDIO
- ✅ WAKE_LOCK
- ✅ INTERNET
- ✅ ACCESS_NETWORK_STATE
- ✅ MODIFY_AUDIO_SETTINGS
- ✅ WRITE_EXTERNAL_STORAGE
- ✅ READ_EXTERNAL_STORAGE
- ✅ VIBRATE

**iOS (Info.plist):**
- ✅ NSCameraUsageDescription
- ✅ NSMicrophoneUsageDescription
- ✅ NSPhotoLibraryUsageDescription
- ✅ NSPhotoLibraryAddUsageDescription
- ✅ UIBackgroundModes (audio, voip)

### 7. **No Expo Go Usage** ✓
- ✅ Project configured for standalone builds only
- ✅ Development client enabled in EAS config
- ✅ All native modules require custom dev client

## 🚀 Build Instructions

### Step 1: Set Your Expo Project ID

Before building, you need to set your Expo project ID:

1. If you don't have one, create it:
   ```bash
   eas init
   ```

2. Update `app.json` or `app.config.js`:
   ```json
   "extra": {
     "eas": {
       "projectId": "your-actual-project-id-here"
     }
   }
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Prebuild

This generates the native Android and iOS projects:

```bash
npx expo prebuild --clean
```

**Expected Output:**
- ✅ `android/` folder created with native Android project
- ✅ `ios/` folder created with native iOS project
- ✅ All native modules linked automatically
- ✅ Permissions added to manifests

### Step 4: Build with EAS

#### Development Build (Recommended for Testing)

**Android:**
```bash
eas build -p android --profile development
```

**iOS:**
```bash
eas build -p ios --profile development
```

#### Production Build

**Android:**
```bash
eas build -p android --profile production
```

**iOS:**
```bash
eas build -p ios --profile production
```

### Step 5: Install and Test

1. Download the APK/IPA from EAS dashboard
2. Install on your device
3. Test all features:
   - ✅ Camera access
   - ✅ Microphone access
   - ✅ Live streaming
   - ✅ Gift animations
   - ✅ Multi-guest features
   - ✅ Filters and effects
   - ✅ Push notifications

## 🔧 Troubleshooting

### Build Fails with "react-native-nodemediaclient not found"

**Solution:** Already handled! The module is excluded in `app.json`:
```json
"autolinking": {
  "exclude": ["react-native-nodemediaclient"]
}
```

### WebRTC Not Working

**Check:**
1. ✅ Build is a native build (not Expo Go)
2. ✅ Camera and microphone permissions granted
3. ✅ Internet connection stable
4. ✅ Cloudflare Stream API configured correctly

**Debug:**
```javascript
// Check if WebRTC is available
console.log('WebRTC available:', Platform.OS !== 'web' ? !!RTCPeerConnection : typeof RTCPeerConnection !== 'undefined');
```

### Camera Permissions Denied

**Android:**
- Go to Settings → Apps → Roast Live → Permissions
- Enable Camera and Microphone

**iOS:**
- Go to Settings → Roast Live
- Enable Camera and Microphone

### Gift Animations Not Smooth

**Check:**
1. ✅ `react-native-reanimated/plugin` is last in babel.config.js
2. ✅ Clear cache: `npx expo start --clear`
3. ✅ Rebuild: `eas build --clear-cache`

### Build Takes Too Long

**Tips:**
- Use `--profile development` for faster builds
- Enable caching in EAS
- Use local builds: `eas build --local`

## 📱 Platform-Specific Notes

### Android

- **Minimum SDK:** 21 (Android 5.0)
- **Target SDK:** 34 (Android 14)
- **Build Type:** APK (development/preview), AAB (production)
- **Permissions:** Automatically added via plugins

### iOS

- **Minimum iOS:** 13.4
- **Bitcode:** Disabled (required for WebRTC)
- **Background Modes:** Audio, VoIP (for streaming)
- **Permissions:** Automatically added via plugins

## 🎯 What Works Now

After building with EAS, you'll have:

✅ **Full WebRTC streaming** - No more OBS needed!
✅ **Native camera access** - Flash, filters, switching work
✅ **Gift animations** - Smooth, native animations
✅ **Multi-guest streaming** - All UI components functional
✅ **Push notifications** - Full native support
✅ **Chat overlay** - Real-time messaging
✅ **Filters and effects** - Camera filters work natively

## 🔐 Security Notes

1. **Never commit:**
   - Expo project ID (use environment variables)
   - API keys
   - Cloudflare credentials

2. **Use environment variables:**
   ```bash
   # .env
   EXPO_PUBLIC_PROJECT_ID=your-project-id
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Secure your Cloudflare Stream:**
   - Use signed URLs for playback
   - Implement token authentication
   - Rate limit API calls

## 📚 Additional Resources

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [react-native-webrtc Documentation](https://github.com/react-native-webrtc/react-native-webrtc)
- [Cloudflare Stream WHIP Documentation](https://developers.cloudflare.com/stream/webrtc/)
- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native Reanimated Documentation](https://docs.swmansion.com/react-native-reanimated/)

## 🆘 Need Help?

If you encounter issues:

1. Check the EAS build logs
2. Review the troubleshooting section above
3. Ensure all dependencies are installed
4. Clear caches and rebuild
5. Check platform-specific requirements

## 🎉 Success Checklist

After building, verify:

- [ ] App installs without errors
- [ ] Camera permission prompt appears
- [ ] Microphone permission prompt appears
- [ ] Can start a live stream
- [ ] Camera preview shows correctly
- [ ] Can switch between front/back camera
- [ ] Flash works (back camera only)
- [ ] Gift animations play smoothly
- [ ] Chat messages appear in real-time
- [ ] Multi-guest UI renders correctly
- [ ] Push notifications work
- [ ] App doesn't crash on background/foreground

## 🚀 Next Steps

1. **Test thoroughly** on real devices
2. **Submit to app stores** when ready
3. **Monitor performance** with analytics
4. **Gather user feedback** and iterate
5. **Keep dependencies updated** regularly

---

**Note:** This configuration does NOT modify any Cloudflare Live API logic, streaming start/stop logic, access tokens, or existing backend integrations. It only configures the app for native builds with full feature support.
