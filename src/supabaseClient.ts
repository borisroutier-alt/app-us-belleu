import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://ufkqcjbawlxrbpenmans.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVma3FjamJhd2x4cmJwZW5tYW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODcyNDQsImV4cCI6MjA5NDk2MzI0NH0.YLUL6pfWkm_0Q2P0HI71_qdS2Fqd5gzyew-zeVmBq6o';

// Un adaptateur hybride : SecureStore sur mobile, localStorage sécurisé sur le Web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null; // Évite le crash SSR sur GitHub pendant le build
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true, // Renouvelle automatiquement la session si elle expire
    persistSession: true,   // Garde l'adhérent connecté
    detectSessionInUrl: false,
  },
});