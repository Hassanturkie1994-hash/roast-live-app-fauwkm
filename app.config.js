
module.exports = ({ config }) => {
  // This tells EAS to not try to write to this dynamic config
  config._internalSkipAppJson = true;
  
  return {
    name: "Roast Live",
    slug: "roast-live",
    owner: "hasselite",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/natively-dark.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    scheme: "roastlive",

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
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
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
          icon: "./assets/images/notification-icon.png",
          color: "#A40028",
          sounds: ["./assets/sounds/notification.wav"],
          androidMode: "default",
          androidCollapsedTitle: "{{unread_count}} new notifications"
        }
      ]
    ],

    experiments: {
      typedRoutes: true
    },

    extra: {
      eas: {
        projectId: "b1994843-ea99-4a51-8db1-d1049a44b5b7"
      },

      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,

      CLOUDFLARE_R2_PUBLIC_BASE_URL:
        process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL ||
        "https://pub-YOUR_ACCOUNT_ID.r2.dev",

      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,

      SUPABASE_FUNCTIONS_URL:
        process.env.SUPABASE_FUNCTIONS_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1"
    },

    autolinking: {
      exclude: ["react-native-nodemediaclient"]
    }
  };
};
