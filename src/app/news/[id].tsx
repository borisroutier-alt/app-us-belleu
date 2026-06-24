import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { uploadImageToStorage } from '../../../utils/imageUpload';
import { supabase } from '../../supabaseClient';

export default function NewsDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // États pour l'édition
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAndFetchArticle();
  }, [id]);

  const checkAdminAndFetchArticle = async () => {
    setLoading(true);
    // Logique de récupération de l'article
    const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
    if (data) {
        setArticle(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditCategory(data.category);
    }
    // Vérification admin (à adapter selon votre logique)
    const { data: { user } } = await supabase.auth.getUser();
    setIsAdmin(!!user); 
    setLoading(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission refusée", "Nous avons besoin de l'accès à vos photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setEditImageUri(result.assets[0].uri);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    let finalImageUrl = article?.image_url;

    try {
      if (editImageUri) {
        finalImageUrl = await uploadImageToStorage(editImageUri);
      }

      const { error } = await supabase
        .from('news')
        .update({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          image_url: finalImageUrl,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert("Succès", "Actualité mise à jour !");
      setIsEditing(false);
      setEditImageUri(null);
      checkAdminAndFetchArticle();
    } catch (err: any) {
      Alert.alert("Erreur", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container}>
      {isEditing ? (
        <View style={styles.form}>
          <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Titre" />
          <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} placeholder="Catégorie" />
          <TextInput style={[styles.input, { height: 100 }]} value={editDescription} onChangeText={setEditDescription} multiline placeholder="Description" />
          
          <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
            <Text style={styles.btnText}>📷 Choisir une nouvelle photo</Text>
          </TouchableOpacity>

          {(editImageUri || article?.image_url) && (
            <Image 
              source={{ uri: editImageUri || article?.image_url }} 
              style={styles.articleImage} 
            />
          )}
          
          <TouchableOpacity style={styles.btnSuccess} onPress={handleUpdate}>
            <Text style={styles.btnText}>ENREGISTRER LES MODIFICATIONS</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {article?.image_url && <Image source={{ uri: article.image_url }} style={styles.articleImage} />}
          <Text style={styles.title}>{article?.title}</Text>
          <Text style={styles.text}>{article?.description}</Text>
          {isAdmin && (
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Text style={styles.btnText}>Modifier l'article</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  form: { padding: 20 },
  articleImage: { width: '100%', height: 200, resizeMode: 'cover', marginBottom: 15 },
  input: { backgroundColor: '#FFF', padding: 10, marginBottom: 10, borderRadius: 5 },
  imagePickerBtn: { backgroundColor: '#C5A059', padding: 15, alignItems: 'center', marginBottom: 15, borderRadius: 5 },
  btnSuccess: { backgroundColor: '#10B981', padding: 15, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  editBtn: { backgroundColor: '#3B82F6', padding: 15, margin: 20, alignItems: 'center', borderRadius: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', padding: 20 },
  text: { color: '#CCC', paddingHorizontal: 20, fontSize: 16 }
});