import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../hermes-polyfill.js';
import { supabase } from '../supabaseClient';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Gestion de l'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Logique session
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // En mode hash, le '/' pointe vers le hash root, c'est parfait
        router.replace('/'); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ 
          headerShown: false,
          // Ajout important pour le web : éviter les problèmes de liens lors du rafraîchissement
          animation: Platform.OS === 'web' ? 'none' : 'default' 
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="news/[id]" />
        <Stack.Screen name="admin" />
      </Stack>
    </SafeAreaProvider>
  );
}