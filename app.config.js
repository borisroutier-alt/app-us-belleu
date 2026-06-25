module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    owner: "usbelleu",
    scheme: "usbelleuapp",
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
      predictiveBackGestureEnabled: false,
      package: "com.usbelleu.usbelleuapp",
      ggoogleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json"
    },
    web: {
      bundler: "metro",
      output: "static",
      baseUrl: "/",
      favicon: "./assets/images/favicon-v2.png",
      appleTouchIcon: "./assets/images/apple-touch-icon.png",
      pwa: {
        enabled: true,
        title: "US Belleu",
        shortName: "USB",
        description: "Application officielle de l'US Belleu",
        backgroundColor: "#14294E",
        themeColor: "#14294E",
        display: "standalone",
        orientation: "portrait"
      }
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      router: {
        origin: false
      },
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
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#14294E"
        }
      ]
    ]
  }
};