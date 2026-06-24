import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Platform } from 'react-native';

const PROJECT_ID = '8ffb7218-c17e-41f5-a838-843a7aa4c4a1';

// 1. La fonction de récupération (à insérer ici)
const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.warn("⚠️ Pas un vrai appareil. Notifications désactivées.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn("⚠️ Permission refusée par l'utilisateur.");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    console.log("✅ Token généré avec succès :", tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error("❌ Erreur critique getExpoPushTokenAsync :", error);
    return null;
  }
};

// 2. Le Hook qui utilise la fonction
export const usePushNotifications = (isLoggedIn: boolean) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      registerForPushNotificationsAsync().then(async (pushToken) => {
        if (pushToken) {
          setToken(pushToken);
          
          // Synchronisation avec Supabase
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            const { error } = await supabase
              .from('licencies_autorises')
              .update({ expo_push_token: pushToken })
              .eq('email', user.email.toLowerCase().trim());

            if (error) console.error("Erreur Supabase :", error.message);
            else console.log("🚀 Jeton synchronisé avec succès !");
          }
        }
      });
    }
  }, [isLoggedIn]);

  return { pushToken: token };
};