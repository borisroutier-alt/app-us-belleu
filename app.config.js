module.exports = ({ config }) => {
  return {
    ...config,
    web: {
      ...config.web,
      // Le "." permet aux liens d'être relatifs au fichier actuel
      baseUrl: ".", 
    },
    extra: {
      ...config.extra,
      router: {
        ...config.extra?.router,
        origin: false,
      },
    },
  };
};