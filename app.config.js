module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    web: {
      bundler: "metro",
      output: "static",
      // Supprimez "basePath" complètement
    },
    // On force le routeur en mode "hash"
    extra: {
      router: {
        origin: false,
      },
    },
  },
};