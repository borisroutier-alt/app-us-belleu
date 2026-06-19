module.exports = ({ config }) => {
  return {
    ...config,
    web: {
      ...config.web,
      // Le "." indique d'utiliser des chemins relatifs par rapport au dossier courant
      baseUrl: ".", 
    },
    extra: {
      ...config.extra,
      router: {
        ...config.extra?.router,
        // 'origin: false' empêche Expo de forcer l'URL racine
        origin: false,
      },
    },
  };
};