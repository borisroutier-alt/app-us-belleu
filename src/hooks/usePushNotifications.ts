import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

// Configuration du comportement des notifications lorsqu'elles arrivent quand l'appli est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Fonction interne pour demander la permission et récupérer le Token Expo
const registerForPushNotificationsAsync = async () => {
  if (!Device.isDevice) {
    console.log("Les notifications push nécessitent un vrai smartphone.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log("Autorisation de notification refusée par l'utilisateur.");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '8ffb7218-c17e-41f5-a838-843a7aa4c4a1' // ID de projet Expo
    });
    return tokenData.data;
  } catch (error) {
    // MODIFICATION ICI : On utilise console.warn au lieu de console.error 
    // pour éviter que l'application ne plante en cas de panne des serveurs Expo.
    console.warn("⚠️ Serveurs Expo indisponibles (Erreur 503). Le push token sera généré plus tard :", error);
    return null;
  }
};

/**
 * Hook personnalisé pour gérer les notifications Push de l'U.S. Belleu
 * @param isLoggedIn État de connexion de l'utilisateur (true/false)
 */
export const usePushNotifications = (isLoggedIn: boolean) => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // On ne cherche à enregistrer le token que si l'utilisateur est connecté à l'application
    if (isLoggedIn) {
      registerForPushNotificationsAsync().then(async (pushToken) => {
        if (pushToken) {
          setToken(pushToken);

          try {
            // 1. Récupération de l'utilisateur Supabase connecté
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user && user.email) {
              console.log("Tentative de synchronisation du token pour :", user.email);
              
              // 2. CORRECTION : On cible la bonne table, la bonne colonne et on filtre par email
              const { error } = await supabase
                .from('licencies_autorises')
                .update({ expo_push_token: pushToken })
                .eq('email', user.email.toLowerCase().trim());

              if (error) {
                console.error("Erreur Supabase lors de la synchronisation :", error.message);
              } else {
                console.log("🚀 Jeton de notification synchronisé avec la table licencies_autorises !");
              }
            }
          } catch (error) {
            console.error("Erreur lors de la synchronisation du token avec Supabase :", error);
          }
        }
      });
    }
  }, [isLoggedIn]);

  return { pushToken: token };
};