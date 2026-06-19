module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    web: {
      bundler: "metro",
      output: "static",
      // C'est ici que tu dois définir le chemin relatif pour le sous-dossier
      // Expo Router l'utilisera pour construire ses routes internes
      baseUrl: "/app-us-belleu", 
    },
    extra: {
      router: {
        origin: false,
      },
    },
  },
};