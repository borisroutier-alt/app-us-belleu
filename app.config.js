module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    web: {
      bundler: "metro",
      output: "static",
      // On supprime basePath ici.
    },
    experiments: {
      typedRoutes: true,
    },
  },
};