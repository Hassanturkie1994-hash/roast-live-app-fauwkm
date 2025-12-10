
# Quick Build Reference - Roast Live

## 🚀 Fast Track to Native Build

### Prerequisites
```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login
```

### 1. Set Project ID (First Time Only)
```bash
# Initialize EAS project
eas init

# This will create/update your project ID in app.json
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build for Android (Development)
```bash
# Option A: Using npm script
npm run eas:dev:android

# Option B: Direct command
eas build -p android --profile development
```

### 4. Build for iOS (Development)
```bash
# Option A: Using npm script
npm run eas:dev:ios

# Option B: Direct command
eas build -p ios --profile development
```

## 📦 Available Build Profiles

### Development
- **Purpose:** Testing with development tools
- **Output:** APK (Android), Development IPA (iOS)
- **Features:** Debug mode, development client
- **Command:** `npm run eas:dev:android` or `npm run eas:dev:ios`

### Preview
- **Purpose:** Internal testing, beta distribution
- **Output:** APK (Android), Ad-hoc IPA (iOS)
- **Features:** Production-like, internal distribution
- **Command:** `npm run eas:preview:android` or `npm run eas:preview:ios`

### Production
- **Purpose:** App store submission
- **Output:** AAB (Android), App Store IPA (iOS)
- **Features:** Optimized, signed for stores
- **Command:** `npm run eas:prod:android` or `npm run eas:prod:ios`

## 🔧 Prebuild (Generate Native Projects)

```bash
# Clean prebuild for both platforms
npm run prebuild

# Android only
npm run prebuild:android

# iOS only
npm run prebuild:ios
```

**Note:** Prebuild is automatically run by EAS, but you can run it locally to inspect native projects.

## ⚡ Quick Commands

```bash
# Start development server
npm run dev

# Start with Android
npm run android

# Start with iOS
npm run ios

# Build Android development APK
npm run eas:dev:android

# Build iOS development IPA
npm run eas:dev:ios

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

## 🎯 What Gets Built

### Native Features Included:
- ✅ WebRTC streaming (react-native-webrtc)
- ✅ Camera with filters (expo-camera)
- ✅ Gift animations (react-native-reanimated + lottie)
- ✅ Push notifications (expo-notifications)
- ✅ Multi-guest streaming UI
- ✅ Chat overlay
- ✅ All permissions configured

### NOT Included (Expo Go):
- ❌ WebRTC won't work in Expo Go
- ❌ Some native modules won't work in Expo Go
- ❌ Must use development build or production build

## 🐛 Common Issues & Fixes

### "No project ID found"
```bash
# Run this first
eas init
```

### "Build failed - autolinking error"
Already fixed! `react-native-nodemediaclient` is excluded in `app.json`.

### "WebRTC not working"
Make sure you're using a native build, not Expo Go.

### "Permissions denied"
Check that permissions are granted in device settings.

### "Build takes forever"
- Use development profile for faster builds
- Enable caching: `eas build --clear-cache` (first time only)

## 📱 After Build Completes

1. **Download from EAS Dashboard:**
   - Go to https://expo.dev
   - Navigate to your project
   - Click on "Builds"
   - Download APK/IPA

2. **Install on Device:**
   - **Android:** Transfer APK and install
   - **iOS:** Use TestFlight or ad-hoc distribution

3. **Test Features:**
   - Camera access
   - Microphone access
   - Live streaming
   - Gift animations
   - Multi-guest features
   - Push notifications

## 🔐 Environment Variables

Create `.env` file (don't commit):
```bash
EXPO_PUBLIC_PROJECT_ID=your-project-id
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Build Time Estimates

- **Development Build:** 10-20 minutes
- **Preview Build:** 15-25 minutes
- **Production Build:** 20-30 minutes

*Times vary based on EAS server load and project size.*

## 🆘 Need Help?

1. Check build logs: `eas build:view [build-id]`
2. Review EAS_BUILD_SETUP_GUIDE.md
3. Check Expo documentation: https://docs.expo.dev
4. Check build status: https://expo.dev

## ✅ Success Indicators

After successful build:
- ✅ Build status shows "Finished"
- ✅ APK/IPA available for download
- ✅ No red errors in build logs
- ✅ App installs on device
- ✅ All permissions work
- ✅ Camera and streaming functional

---

**Remember:** Always test on real devices, not just simulators/emulators!
