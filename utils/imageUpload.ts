import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../src/supabaseClient';

export const uploadImageToStorage = async (uri: string): Promise<string | null> => {
  try {
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
    
    // Lecture du fichier en base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Upload vers Supabase
    const { data, error } = await supabase.storage
      .from('news-images')
      .upload(fileName, decode(base64), {
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      });

    if (error) throw error;

    // Récupération de l'URL publique
    const { data: publicData } = supabase.storage.from('news-images').getPublicUrl(fileName);
    return publicData.publicUrl;
  } catch (error) {
    console.error("Erreur upload:", error);
    return null;
  }
};