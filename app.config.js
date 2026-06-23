module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    web: {
      bundler: "metro",
      output: "static",
      // On retire le basePath car le HashRouting rend le site agnostique au chemin
      basePath: "/", 
    },
    // On force l'utilisation du HashRouter dans le bundle web
    extra: {
      router: {
        origin: false,
        experiments: {
          // Ceci active la navigation par hash (ex: /#/classement)
          typedRoutes: true,
        },
      },
    },
  },
};