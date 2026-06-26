import { Stack } from 'expo-router';

export default function EffectifsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // On masque le header par défaut car nous avons créé notre propre header dans les pages
        contentStyle: { backgroundColor: '#061329' }, // Couleur de fond harmonisée
      }}
    />
  );
}