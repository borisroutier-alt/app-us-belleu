import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { uploadImageToStorage } from '../../../utils/imageUpload'; // Importation de l'utilitaire
import { supabase } from '../../supabaseClient';

export default function AdminPanel() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleAddNews = async () => {
    if (!title || !description || !imageUri) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs et choisir une image.");
      return;
    }

    setLoading(true);

    try {
      // Utilisation de la fonction centralisée
      const imageUrl = await uploadImageToStorage(imageUri);

      if (!imageUrl) throw new Error("Erreur lors de l'upload de l'image");

      const { error } = await supabase.from('news').insert({
        title,
        description,
        category,
        image_url: imageUrl,
      });

      if (error) throw error;

      Alert.alert("Succès", "Actualité ajoutée avec succès !");
      // Reset du formulaire
      setTitle('');
      setDescription('');
      setCategory('');
      setImageUri(null);
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Ajouter une actualité</Text>
      
      <TextInput style={styles.input} placeholder="Titre" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Catégorie" value={category} onChangeText={setCategory} />
      <TextInput style={[styles.input, { height: 100 }]} placeholder="Description" value={description} onChangeText={setDescription} multiline />
      
      <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
        <Text style={styles.btnText}>{imageUri ? "Image sélectionnée" : "Choisir une image"}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.btnSuccess, { opacity: loading ? 0.5 : 1 }]} 
        onPress={handleAddNews} 
        disabled={loading}
      >
        <Text style={styles.btnText}>{loading ? "Chargement..." : "PUBLIER L'ACTUALITÉ"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#061329' },
  header: { fontSize: 24, color: '#FFF', marginBottom: 20, fontWeight: 'bold' },
  input: { backgroundColor: '#FFF', padding: 10, marginBottom: 15, borderRadius: 5 },
  imagePickerBtn: { backgroundColor: '#4B5563', padding: 15, alignItems: 'center', marginBottom: 15, borderRadius: 5 },
  btnSuccess: { backgroundColor: '#10B981', padding: 15, alignItems: 'center', borderRadius: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});