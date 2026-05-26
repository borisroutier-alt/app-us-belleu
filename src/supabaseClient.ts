import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Remplace ces deux textes par les vraies valeurs que tu as trouvées à l'étape 2 !
const SUPABASE_URL = 'https://ufkqcjbawlxrbpenmans.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVma3FjamJhd2x4cmJwZW5tYW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODcyNDQsImV4cCI6MjA5NDk2MzI0NH0.YLUL6pfWkm_0Q2P0HI71_qdS2Fqd5gzyew-zeVmBq6o';


// Un petit adaptateur pour que Supabase comprenne comment Expo stocke les données
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
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