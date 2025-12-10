
# EAS Build FAQ - Roast Live

## ❓ Frequently Asked Questions

### General Questions

#### Q: What is EAS Build?
**A:** EAS (Expo Application Services) Build is a cloud service that compiles your React Native app into native Android (APK/AAB) and iOS (IPA) binaries. It's like having a build server in the cloud.

#### Q: Why can't I use Expo Go?
**A:** Expo Go is a sandbox app that doesn't support custom native modules like `react-native-webrtc`. Your app needs WebRTC for live streaming, which requires a custom native build.

#### Q: How much does EAS Build cost?
**A:** EAS Build has a free tier with limited builds per month. Check [Expo pricing](https://expo.dev/pricing) for current limits and paid plans.

---

### Setup Questions

#### Q: Do I need a Mac to build for iOS?
**A:** No! EAS Build runs in the cloud, so you can build iOS apps from any platform (Windows, Mac, Linux).

#### Q: What's the difference between development, preview, and production builds?
**A:**
- **Development:** Includes debug tools, faster builds, for testing
- **Preview:** Production-like, for internal/beta testing
- **Production:** Optimized, signed, for app store submission

#### Q: How do I get my Expo project ID?
**A:** Run `eas init` in your project directory. It will create a project and add the ID to your `app.json`.

#### Q: Can I build locally instead of in the cloud?
**A:** Yes! Use `eas build --local`, but you'll need to set up the native build environment (Android Studio, Xcode).

---

### Build Questions

#### Q: How long does a build take?
**A:**
- Development: 10-20 minutes
- Preview: 15-25 minutes
- Production: 20-30 minutes

Times vary based on EAS server load.

#### Q: Can I cancel a build?
**A:** Yes! Use `eas build:cancel [build-id]` or cancel from the EAS dashboard.

#### Q: How do I check build status?
**A:** Use `eas build:list` to see all builds, or `eas build:view [build-id]` for a specific build.

#### Q: Where do I download the APK/IPA?
**A:** From the EAS dashboard at https://expo.dev, or scan the QR code shown after build completes.

#### Q: Can I build for both Android and iOS at once?
**A:** Yes! Use `eas build --platform all`, but it counts as two builds.

---

### WebRTC Questions

#### Q: Why isn't WebRTC working?
**A:** Common reasons:
1. Using Expo Go (not supported)
2. Permissions not granted
3. Network issues
4. Cloudflare Stream not configured

#### Q: Does WebRTC work on web?
**A:** Yes! The web version uses the browser's native WebRTC API.

#### Q: What video quality does WebRTC support?
**A:** Target is 1080p (1080x1920) at 30-60fps, but actual quality depends on device and network.

#### Q: Can I use WebRTC without Cloudflare?
**A:** Yes, but you'll need to modify the WebRTCLivePublisher component to use a different WHIP endpoint.

---

### Camera Questions

#### Q: Why is my camera showing a black screen?
**A:** Common causes:
1. Permission not granted
2. Camera in use by another app
3. Device doesn't support requested resolution
4. Try switching front/back camera

#### Q: Does flash work on front camera?
**A:** No, flash only works on back camera (hardware limitation).

#### Q: Can I use custom camera filters?
**A:** Yes! The CameraFilterSelector component supports multiple filters. You can add more in the component.

#### Q: What camera resolutions are supported?
**A:** Target is 1080p, fallback to 720p. Actual resolution depends on device capabilities.

---

### Animation Questions

#### Q: Why are gift animations laggy?
**A:** Common causes:
1. Reanimated plugin not last in babel.config.js
2. Testing on emulator (use real device)
3. Too many animations at once
4. Not using native driver

#### Q: Can I add custom gift animations?
**A:** Yes! Edit GiftAnimationOverlay.tsx to add new animation types.

#### Q: Do Lottie animations work?
**A:** Yes! `lottie-react-native` is installed and configured.

#### Q: Why do animations work in Expo Go but not in build?
**A:** Ensure `react-native-reanimated/plugin` is last in babel.config.js and rebuild.

---

### Permission Questions

#### Q: How do I request permissions?
**A:** Permissions are automatically requested when you try to use a feature (camera, microphone, etc.).

#### Q: What if user denies permission?
**A:** Show a message explaining why the permission is needed and direct them to device settings.

#### Q: Can I test permissions in Expo Go?
**A:** Yes, but some permissions (like WebRTC) won't work in Expo Go.

#### Q: How do I add custom permission descriptions?
**A:** Edit the `infoPlist` section in `app.json` for iOS, and permissions are auto-added for Android.

---

### Troubleshooting Questions

#### Q: Build failed with "react-native-nodemediaclient not found"
**A:** This is already fixed! The module is excluded in `app.json`. If still failing, run `eas build --clear-cache`.

#### Q: App crashes on launch
**A:** Check device logs:
- Android: `adb logcat | grep -i "roast"`
- iOS: Xcode → Devices → View Device Logs

#### Q: Features work in development but not production
**A:** Ensure you're testing a native build (not Expo Go) and all permissions are granted.

#### Q: Build takes forever
**A:** Try:
1. Use development profile (faster)
2. Clear cache: `eas build --clear-cache`
3. Check EAS status: https://status.expo.dev

---

### Deployment Questions

#### Q: How do I submit to Google Play?
**A:** Build with production profile, then use `eas submit -p android`.

#### Q: How do I submit to App Store?
**A:** Build with production profile, then use `eas submit -p ios`. You'll need an Apple Developer account.

#### Q: Can I update my app without rebuilding?
**A:** For JavaScript changes, yes! Use EAS Update. For native changes, you need to rebuild.

#### Q: How do I handle app updates?
**A:** Use EAS Update for OTA updates, or publish new versions to app stores.

---

### Performance Questions

#### Q: How can I optimize build time?
**A:**
1. Use development profile for testing
2. Enable caching (automatic after first build)
3. Use local builds for faster iteration

#### Q: How can I optimize app performance?
**A:**
1. Use native driver for animations
2. Optimize images
3. Lazy load components
4. Profile with React DevTools

#### Q: Why is my APK so large?
**A:** Native modules add size. Use AAB for production (Google Play optimizes size).

#### Q: How can I reduce app size?
**A:**
1. Remove unused dependencies
2. Use AAB instead of APK
3. Enable ProGuard (Android)
4. Optimize assets

---

### Security Questions

#### Q: Are my API keys safe?
**A:** Use environment variables and never commit them to git. EAS Build supports secrets.

#### Q: How do I add environment variables?
**A:** Use `eas secret:create` or add to `.env` file (don't commit).

#### Q: Is EAS Build secure?
**A:** Yes! Builds run in isolated containers and are deleted after completion.

#### Q: How do I sign my app?
**A:** EAS handles signing automatically. For production, you can provide your own credentials.

---

### Cost Questions

#### Q: How many free builds do I get?
**A:** Check [Expo pricing](https://expo.dev/pricing) for current free tier limits.

#### Q: What happens if I run out of free builds?
**A:** You'll need to upgrade to a paid plan or wait for the next billing cycle.

#### Q: Can I use EAS Build for commercial apps?
**A:** Yes! EAS Build supports commercial apps on all plans.

#### Q: Are there any hidden costs?
**A:** No hidden costs, but app store fees apply (Google Play: $25 one-time, App Store: $99/year).

---

### Advanced Questions

#### Q: Can I customize the build process?
**A:** Yes! Use `eas.json` to configure build profiles and add custom scripts.

#### Q: Can I use custom native modules?
**A:** Yes! Add them to `package.json` and they'll be auto-linked.

#### Q: Can I access native code?
**A:** Yes! Run `npx expo prebuild` to generate native projects, then modify as needed.

#### Q: Can I use EAS Build with bare React Native?
**A:** Yes! EAS Build supports both managed and bare workflows.

---

### Migration Questions

#### Q: I'm coming from Expo Go, what changes?
**A:** You'll need to build a custom development client. WebRTC and other native features will now work.

#### Q: Can I migrate from bare React Native to Expo?
**A:** Yes! Follow the [Expo adoption guide](https://docs.expo.dev/bare/installing-expo-modules/).

#### Q: Will my existing code work?
**A:** Most code will work, but you may need to adjust for native modules.

#### Q: Do I need to rewrite my app?
**A:** No! This configuration doesn't require rewriting. All your existing code works.

---

### Support Questions

#### Q: Where can I get help?
**A:**
1. Check documentation in this repo
2. [Expo Discord](https://chat.expo.dev)
3. [Expo Forums](https://forums.expo.dev)
4. [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

#### Q: How do I report a bug?
**A:**
1. Check if it's a known issue
2. Create a minimal reproduction
3. Report on [Expo GitHub](https://github.com/expo/expo/issues)

#### Q: Can I get professional support?
**A:** Yes! Expo offers professional support plans. Check [Expo pricing](https://expo.dev/pricing).

#### Q: Where's the documentation?
**A:** All documentation is in this repo:
- EAS_BUILD_SETUP_GUIDE.md
- QUICK_BUILD_REFERENCE.md
- EAS_BUILD_CHECKLIST.md
- EAS_BUILD_TROUBLESHOOTING.md

---

### Specific Feature Questions

#### Q: How do multi-guest streams work?
**A:** The UI is built, but you'll need to implement the WebRTC peer-to-peer connections for multiple guests.

#### Q: How do push notifications work?
**A:** Using `expo-notifications` with Firebase (Android) and APNs (iOS). Configure in Supabase.

#### Q: How does the gift system work?
**A:** Gifts are sent via Supabase real-time, animations play using Reanimated.

#### Q: How does chat work?
**A:** Real-time chat using Supabase real-time subscriptions.

---

## 🆘 Still Have Questions?

1. **Check the docs:** Review all documentation files in this repo
2. **Search issues:** Check if someone else had the same question
3. **Ask the community:** Expo Discord and Forums are very helpful
4. **Create an issue:** If you found a bug, report it

---

**Remember:** Most questions are answered in the documentation files. Start there!
