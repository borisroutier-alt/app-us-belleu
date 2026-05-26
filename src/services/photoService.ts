import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { supabase } from '../supabaseClient'; // Ajuste le chemin selon ton projet

/**
 * Convertit l'URI locale d'une image en un Blob compatible avec React Native / Supabase
 * Évite l'erreur : "Creating blobs from ArrayBuffer and arraybufferview are not supported"
 */
const uritoBlob = (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = function (e) {
      console.error(e);
      reject(new TypeError("Le décodage de l'image compressée a échoué."));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
};

export const selectionnerEtEnvoyerPhoto = async (userId: string) => {
  try {
    // 1. Demander la permission et ouvrir la galerie
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission refusée", "L'application a besoin d'accéder à vos photos pour les partager.");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // Permet à l'utilisateur de cadrer sa photo
      quality: 1, // On la prend au max ici, on compresse à l'étape suivante
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null; // L'utilisateur a annulé
    }

    const imageOriginale = result.assets[0];
    console.log(`Poids original estimé : ${imageOriginale.fileSize ? (imageOriginale.fileSize / 1024 / 1024).toFixed(2) : 'Inconnu'} Mo`);

    // 2. LA COMPRESSION MAGIQUE 🛠️
    // On redimensionne à une largeur max de 1200px (largement suffisant pour du mobile)
    // et on baisse la qualité à 70% (JPEG compressé de manière optimale)
    const imageCompressee = await ImageManipulator.manipulateAsync(
      imageOriginale.uri,
      [{ resize: { width: 1200 } }], 
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 3. Préparer le fichier pour Supabase Storage
    const extension = 'jpg';
    const nomFichier = `${Date.now()}_${userId}.${extension}`;
    const cheminFichier = `galerie/${nomFichier}`;

    // CORRECTION ICI : Remplacement de fetch().blob() par XMLHttpRequest
    const blob = await uritoBlob(imageCompressee.uri);

    // 4. Envoi vers le Bucket Supabase
    const { data, error: uploadError } = await supabase.storage
      .from('galerie-photos')
      .upload(cheminFichier, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error("Échec de l'envoi sur le stockage : " + uploadError.message);
    }

    // 5. Récupérer l'URL publique de la photo
    const { data: urlData } = supabase.storage
      .from('galerie-photos')
      .getPublicUrl(cheminFichier);

    const urlPublique = urlData.publicUrl;

    // 6. Enregistrer l'URL dans ta table de base de données 'photos_club'
    const { error: dbError } = await supabase
      .from('photos_club')
      .insert([
        {
          url: urlPublique,
          id_utilisateur: userId,
          cree_le: new Date().toISOString()
        }
      ]);

    if (dbError) {
      throw new Error("Impossible d'enregistrer la photo dans la base : " + dbError.message);
    }

    Alert.alert("Succès ! 🎉", "La photo a été compressée et partagée avec succès sur l'application.");
    return urlPublique;

  } catch (error: any) {
    Alert.alert("Erreur lors du partage", error.message);
    console.error(error);
    return null;
  }
};