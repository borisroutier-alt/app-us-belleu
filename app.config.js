module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    web: {
      bundler: "metro",
      output: "static",
      // On retire baseUrl pour forcer l'utilisation de chemins relatifs via le script ci-dessous
    },
    extra: {
      router: {
        origin: false,
      },
    },
  },
};