module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    scheme: "usbelleuapp", // <--- AJOUTEZ CETTE LIGNE ICI
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/images/icon.png"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/images/icon.png"
      },
      package: "com.usbelleu.usbelleuapp"
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon-v2.png",
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      eas: {
        projectId: "8ffb7218-c17e-41f5-a838-843a7aa4c4a1"
      }
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#14294E",
          android: {
            image: "./assets/images/splash.png",
            imageWidth: 76
          }
        }
      ],
      "@react-native-community/datetimepicker",
      "expo-secure-store"
    ]
  },
};