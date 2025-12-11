
module.exports = ({ config }) => {
  // Prevent EAS from modifying this dynamic config
  const expoConfig = {
    name: "Roast Live",
    slug: "roast-live",
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
        NSCameraUsageDescription: "This app needs access to your camera to stream live.",
        NSMicrophoneUsageDescription: "This app needs access to your microphone to stream live.",
        NSPhotoLibraryUsageDescription: "This app needs access to your photo library to select profile pictures and share content.",
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
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      googleServicesFile: "./google-services.json"
    },

    web: {
      favicon: "./assets/images/final_quest_240x240.png",
      bundler: "metro"
    },

    plugins: [
      "expo-font",
      "expo-router",
      "expo-web-browser",
      ["expo-camera", { recordAudioAndroid: true }],
      ["expo-image-picker", {}],
      ["expo-av", {}],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#A40028",
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
        process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL || "https://pub-YOUR_ACCOUNT_ID.r2.dev",
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      SUPABASE_FUNCTIONS_URL:
        process.env.SUPABASE_FUNCTIONS_URL ||
        (process.env.EXPO_PUBLIC_SUPABASE_URL ? process.env.EXPO_PUBLIC_SUPABASE_URL + "/functions/v1" : "")
    },

    autolinking: {
      exclude: ["react-native-nodemediaclient"]
    },

    owner: "hasselite"
  };

  // Mark this config to prevent EAS from trying to write to it
  expoConfig._internal = {
    isDebug: false,
    skipAppJson: true
  };

  return expoConfig;
};
