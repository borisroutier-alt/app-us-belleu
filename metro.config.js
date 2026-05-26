const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Le bouclier anti-Node complet pour Supabase et ses dépendances
config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  zlib: require.resolve('browserify-zlib'),
  crypto: require.resolve('react-native-crypto'),
  util: require.resolve('util/'),
  assert: require.resolve('assert/'), // <-- ON AJOUTE LE POLYFILL ASSERT ICI !
  // Redirection des modules Node inutilisés sur mobile vers une boîte vide
  http: require.resolve('empty-module'),
  https: require.resolve('empty-module'),
  net: require.resolve('empty-module'),
  tls: require.resolve('empty-module'),
  url: require.resolve('empty-module'),
};

module.exports = config;