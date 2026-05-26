import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // <-- On garde UNIQUEMENT le Provider ici
import '../../hermes-polyfill.js';
import { supabase } from '../supabaseClient';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Redirection si nécessaire
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      {/* 
        CORRECTION : On supprime la SafeAreaView globale. 
        On laisse le Stack occuper tout l'écran de manière fluide.
      */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="news/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin/index" options={{ animation: 'fade_from_bottom' }} />
      </Stack>
    </SafeAreaProvider>
  );
}