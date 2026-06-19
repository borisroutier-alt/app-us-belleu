module.exports = ({ config }) => {
  return {
    ...config,
    web: {
      ...config.web,
      // On force le baseUrl spécifiquement pour le web ici
      baseUrl: "/app-us-belleu",
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