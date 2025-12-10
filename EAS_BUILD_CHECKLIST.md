
# EAS Build Checklist - Roast Live

Use this checklist to ensure your build is properly configured and ready for deployment.

## 📋 Pre-Build Checklist

### Configuration Files
- [x] `app.json` - Updated with all plugins and permissions
- [x] `app.config.js` - Created for dynamic configuration
- [x] `eas.json` - Build profiles configured
- [x] `babel.config.js` - Reanimated plugin at the end
- [x] `metro.config.js` - WebRTC support added
- [x] `package.json` - All dependencies installed

### Dependencies
- [x] `react-native-webrtc` - Installed for WebRTC streaming
- [x] `lottie-react-native` - Installed for advanced animations
- [x] `expo-camera` - Already installed
- [x] `expo-notifications` - Already installed
- [x] `react-native-reanimated` - Already installed
- [x] All other dependencies up to date

### Permissions
- [x] Android camera permission
- [x] Android microphone permission
- [x] Android internet permission
- [x] Android wake lock permission
- [x] iOS camera usage description
- [x] iOS microphone usage description
- [x] iOS photo library usage description
- [x] iOS background modes (audio, voip)

### Autolinking
- [x] `react-native-nodemediaclient` excluded
- [x] No other problematic modules

### Code Updates
- [x] WebRTCLivePublisher updated for native WebRTC
- [x] All streaming logic preserved
- [x] Cloudflare API logic untouched
- [x] Backend integrations untouched

## 🚀 Build Process Checklist

### Step 1: Environment Setup
- [ ] EAS CLI installed globally (`npm install -g eas-cli`)
- [ ] Logged into Expo account (`eas login`)
- [ ] Project ID set in app.json/app.config.js
- [ ] Environment variables configured (if needed)

### Step 2: Dependencies
- [ ] Run `npm install`
- [ ] Verify no dependency errors
- [ ] Check for peer dependency warnings

### Step 3: Prebuild (Optional - for inspection)
- [ ] Run `npm run prebuild` (or `npx expo prebuild --clean`)
- [ ] Verify `android/` folder created
- [ ] Verify `ios/` folder created
- [ ] Check AndroidManifest.xml for permissions
- [ ] Check Info.plist for permissions

### Step 4: Build
- [ ] Choose build profile (development/preview/production)
- [ ] Run build command (e.g., `npm run eas:dev:android`)
- [ ] Monitor build progress on EAS dashboard
- [ ] Check for build errors in logs

### Step 5: Post-Build
- [ ] Download APK/IPA from EAS dashboard
- [ ] Install on test device
- [ ] Grant all permissions when prompted
- [ ] Test all features (see testing checklist below)

## 🧪 Testing Checklist

### Basic Functionality
- [ ] App launches without crashing
- [ ] Login/registration works
- [ ] Navigation works correctly
- [ ] UI renders properly

### Camera & Streaming
- [ ] Camera permission granted
- [ ] Camera preview shows correctly
- [ ] Can switch between front/back camera
- [ ] Flash works (back camera only)
- [ ] Can start live stream
- [ ] Stream broadcasts successfully
- [ ] Can end live stream
- [ ] Camera filters work

### WebRTC
- [ ] WebRTC connection establishes
- [ ] Stream reaches Cloudflare
- [ ] Viewers can watch stream
- [ ] Audio is transmitted
- [ ] Video quality is good (1080p target)
- [ ] Connection is stable

### Gift System
- [ ] Gift animations play smoothly
- [ ] Sound effects work
- [ ] Tier A gifts animate correctly
- [ ] Tier B gifts animate correctly
- [ ] Tier C gifts animate correctly
- [ ] Multiple gifts queue properly

### Multi-Guest Features
- [ ] Guest invitation UI works
- [ ] Guest can join stream
- [ ] Multiple guests render correctly
- [ ] Host controls work
- [ ] Guest controls work
- [ ] Audio mixing works

### Chat & Interactions
- [ ] Chat overlay displays
- [ ] Messages send successfully
- [ ] Messages appear in real-time
- [ ] Moderator controls work
- [ ] User blocking works
- [ ] Reporting works

### Push Notifications
- [ ] Notification permission granted
- [ ] Can receive notifications
- [ ] Notifications open correct screen
- [ ] Notification sounds work
- [ ] Badge counts update

### Performance
- [ ] App runs smoothly (60fps target)
- [ ] No memory leaks
- [ ] Battery usage reasonable
- [ ] Network usage reasonable
- [ ] App doesn't overheat device

### Edge Cases
- [ ] App handles background/foreground correctly
- [ ] App handles phone calls during stream
- [ ] App handles network disconnection
- [ ] App handles low battery
- [ ] App handles low storage
- [ ] App handles permission denial

## 🔍 Verification Checklist

### Android Specific
- [ ] APK installs without errors
- [ ] All permissions in AndroidManifest.xml
- [ ] App works on Android 5.0+ (API 21+)
- [ ] App works on different screen sizes
- [ ] Back button behavior correct
- [ ] Hardware acceleration enabled

### iOS Specific
- [ ] IPA installs without errors (TestFlight/ad-hoc)
- [ ] All permissions in Info.plist
- [ ] App works on iOS 13.4+
- [ ] App works on different iPhone models
- [ ] App works on iPad (if supported)
- [ ] Bitcode disabled (required for WebRTC)
- [ ] Background modes configured

## 📊 Build Quality Checklist

### Code Quality
- [x] No console errors in production
- [x] No memory leaks
- [x] Proper error handling
- [x] Loading states implemented
- [x] User feedback for actions

### Security
- [ ] API keys not hardcoded
- [ ] Environment variables used
- [ ] Sensitive data encrypted
- [ ] HTTPS used for all requests
- [ ] User data protected

### Performance
- [x] Images optimized
- [x] Animations use native driver
- [x] Lists use proper recycling
- [x] Network requests optimized
- [x] Caching implemented where appropriate

### User Experience
- [x] Loading indicators shown
- [x] Error messages clear
- [x] Success feedback provided
- [x] Smooth transitions
- [x] Intuitive navigation

## 🚨 Common Issues to Check

### Build Failures
- [ ] Check build logs for errors
- [ ] Verify all dependencies installed
- [ ] Check for conflicting versions
- [ ] Verify autolinking configuration
- [ ] Check for missing native modules

### Runtime Crashes
- [ ] Check device logs
- [ ] Verify permissions granted
- [ ] Check for null pointer errors
- [ ] Verify API endpoints accessible
- [ ] Check for memory issues

### Feature Not Working
- [ ] Verify feature works in development
- [ ] Check if native module linked
- [ ] Verify permissions granted
- [ ] Check network connectivity
- [ ] Review feature-specific logs

## ✅ Final Approval Checklist

Before submitting to app stores:

### Functionality
- [ ] All features work as expected
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] User experience smooth

### Compliance
- [ ] Privacy policy included
- [ ] Terms of service included
- [ ] Age rating appropriate
- [ ] Content guidelines followed
- [ ] Platform policies followed

### Assets
- [ ] App icon correct
- [ ] Splash screen correct
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Keywords optimized

### Store Listing
- [ ] App name finalized
- [ ] Bundle ID/package name correct
- [ ] Version number correct
- [ ] Release notes written
- [ ] Contact information correct

## 📝 Notes

### Build Configuration
- Development builds include debug tools
- Preview builds are production-like but internal
- Production builds are optimized and signed

### Testing Strategy
- Test on multiple devices
- Test on different OS versions
- Test with different network conditions
- Test edge cases and error scenarios

### Deployment Strategy
- Start with development builds for team testing
- Move to preview builds for beta testing
- Deploy production builds to app stores
- Monitor crash reports and user feedback

## 🎉 Success Criteria

Your build is ready when:
- ✅ All checklist items completed
- ✅ All tests passing
- ✅ No critical issues
- ✅ Performance acceptable
- ✅ User experience smooth
- ✅ Ready for app store submission

---

**Remember:** This is a living document. Update it as you discover new issues or requirements!
