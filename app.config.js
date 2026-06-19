module.exports = {
  expo: {
    name: "usbelleu-app",
    slug: "usbelleu-app",
    web: {
      bundler: "metro",
      output: "static",
      basePath: "/app-us-belleu", // Ton sous-dossier
    },
    extra: {
      // Force le routeur à comprendre le chemin complet
      router: {
        origin: "https://borisroutier-alt.github.io/app-us-belleu",
      },
    },
  },
};