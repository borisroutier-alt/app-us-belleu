// 🚀 DOIT ÊTRE LA PREMIÈRE LIGNE
import 'react-native-get-random-values';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../../hermes-polyfill.js';
import { supabase } from '../supabaseClient';

// Handler global : comment afficher les notifications reçues
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Création du canal de notification Android (obligatoire Android 8+)
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    // Gestion de l'authentification
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Logique session
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/'); 
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}