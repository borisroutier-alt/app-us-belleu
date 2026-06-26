import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, Image, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';
import { supabase } from '../../supabaseClient';

export default function AjoutJoueur() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [categorie, setCategorie] = useState('Seniors');
  
  // États pour le poste
  const [poste, setPoste] = useState('Gardien');
  const [posteAutre, setPosteAutre] = useState('');
  
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadAndSave = async () => {
    const posteFinal = poste === 'Autre' ? posteAutre : poste;

    if (!nom || !prenom || !image || (poste === 'Autre' && !posteAutre)) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs et ajouter une photo.");
      return;
    }

    setLoading(true);

    try {
      // 1. Lecture du fichier en Base64
      const base64 = await FileSystem.readAsStringAsync(image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileName = `${Date.now()}_${nom.toLowerCase()}.jpg`;

      // 2. Upload vers Supabase (converti en Buffer)
      const { error: uploadError } = await supabase.storage
        .from('photos_joueurs')
        .upload(fileName, Buffer.from(base64, 'base64'), {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // 3. Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('photos_joueurs')
        .getPublicUrl(fileName);

      // 4. Insertion en base de données
      const { error: dbError } = await supabase.from('joueurs').insert([{
        nom: nom.trim(),
        prenom: prenom.trim(),
        categorie,
        poste: posteFinal,
        photo_url: publicUrl
      }]);

      if (dbError) throw dbError;

      Alert.alert("Succès", "Joueur ajouté avec succès !");
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d'ajouter le joueur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>AJOUTER UN JOUEUR</Text>
        
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? <Image source={{ uri: image }} style={styles.preview} /> : <Text style={styles.placeholderText}>+ Photo</Text>}
        </TouchableOpacity>

        <TextInput style={styles.input} placeholder="Nom" value={nom} onChangeText={setNom} placeholderTextColor="#888" />
        <TextInput style={styles.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} placeholderTextColor="#888" />
        
        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={categorie} onValueChange={(itemValue) => setCategorie(itemValue)} style={styles.picker} dropdownIconColor="#C5A059">
            {['Seniors', 'U18', 'U17', 'U15', 'U13', 'U11', 'U9', 'Dirigeants'].map(cat => (
                <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Poste</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={poste} onValueChange={(itemValue) => setPoste(itemValue)} style={styles.picker} dropdownIconColor="#C5A059">
            <Picker.Item label="Gardien" value="Gardien" />
            <Picker.Item label="Défenseur" value="Défenseur" />
            <Picker.Item label="Milieu" value="Milieu" />
            <Picker.Item label="Attaquant" value="Attaquant" />
            <Picker.Item label="Entraineur" value="Entraineur" />
            <Picker.Item label="Autre" value="Autre" />
          </Picker>
        </View>

        {poste === 'Autre' && (
          <TextInput 
            style={styles.input} 
            placeholder="Précisez le poste..." 
            value={posteAutre} 
            onChangeText={setPosteAutre} 
            placeholderTextColor="#888" 
          />
        )}

        <TouchableOpacity style={styles.button} onPress={uploadAndSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>VALIDER L'AJOUT</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#061329' },
  container: { padding: 20 },
  backButton: { alignSelf: 'flex-start', padding: 10, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8 },
  backText: { color: '#C5A059', fontWeight: 'bold' },
  title: { color: '#C5A059', fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  imagePicker: { width: 150, height: 180, backgroundColor: '#14294E', alignSelf: 'center', marginBottom: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  placeholderText: { color: '#888' },
  preview: { width: '100%', height: '100%', borderRadius: 10 },
  input: { backgroundColor: '#14294E', color: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15 },
  label: { color: '#C5A059', marginBottom: 5, fontSize: 14, fontWeight: '600' },
  pickerContainer: { backgroundColor: '#14294E', borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  picker: { color: '#FFF', height: 50 },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontWeight: 'bold' }
});