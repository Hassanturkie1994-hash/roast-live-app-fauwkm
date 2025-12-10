
module.exports = ({ config }) => {
  return {
    ...config,
    name: "Roast Live",
    slug: "roast-live-app-fauwkm",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/natively-dark.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/natively-dark.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.roastlive.roastlive",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "Allow Roast Live to access your camera to broadcast live streams and create content.",
        NSMicrophoneUsageDescription: "Allow Roast Live to access your microphone to broadcast live streams with audio.",
        NSPhotoLibraryUsageDescription: "Allow Roast Live to access your photo library to share images and videos.",
        NSPhotoLibraryAddUsageDescription: "Allow Roast Live to save photos and videos to your library.",
        UIBackgroundModes: ["audio", "voip"]
      },
      bitcode: false
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/natively-dark.png",
        backgroundColor: "#000000"
      },
      edgeToEdgeEnabled: true,
      package: "com.roastlive.roastlive",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.WAKE_LOCK",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.VIBRATE"
      ]
    },
    web: {
      favicon: "./assets/images/final_quest_240x240.png",
      bundler: "metro"
    },
    plugins: [
      "expo-font",
      "expo-router",
      "expo-web-browser",
      [
        "expo-camera",
        {
          cameraPermission: "Allow Roast Live to access your camera to broadcast live streams.",
          microphonePermission: "Allow Roast Live to access your microphone to broadcast live streams.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Allow Roast Live to access your photos to share images.",
          cameraPermission: "Allow Roast Live to access your camera to take photos."
        }
      ],
      [
        "expo-av",
        {
          microphonePermission: "Allow Roast Live to access your microphone for audio recording."
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/natively-dark.png",
          color: "#E30052",
          sounds: []
        }
      ]
    ],
    scheme: "roastlive",
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {},
      eas: {
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID || "your-expo-project-id-here"
      }
    },
    autolinking: {
      exclude: [
        "react-native-nodemediaclient"
      ]
    }
  };
};
