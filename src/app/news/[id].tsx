import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadImageToStorage } from '../../../utils/imageUpload';
import { supabase } from '../../supabaseClient';

export default function NewsDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImageUri, setEditImageUri] = useState<string | null>(null);
  const [serverImages, setServerImages] = useState<string[]>([]);

  useEffect(() => {
    checkAdminAndFetchArticle();
  }, [id]);

  useEffect(() => {
    if (isEditing) fetchServerImages();
  }, [isEditing]);

  const checkAdminAndFetchArticle = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('news').select('*').eq('id', id).single();
    if (data) {
        setArticle(data);
        setEditTitle(data.title);
        setEditDescription(data.description);
        setEditCategory(data.categorie);
    }
    const { data: { user } } = await supabase.auth.getUser();
    setIsAdmin(!!user); 
    setLoading(false);
  };

  const fetchServerImages = async () => {
    const { data } = await supabase.storage.from('news-images').list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });
    if (data) {
      const urls = data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => supabase.storage.from('news-images').getPublicUrl(f.name).data.publicUrl);
      setServerImages(urls);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    if (!result.canceled) setEditImageUri(result.assets[0].uri);
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      let finalImageUrl = editImageUri ? (await uploadImageToStorage(editImageUri) || article?.image_url) : article?.image_url;
      const { error } = await supabase.from('news').update({
          title: editTitle,
          description: editDescription,
          categorie: editCategory,
          image_url: finalImageUrl,
        }).eq('id', id);

      if (error) throw error;
      Alert.alert("Succès", "Actualité mise à jour !");
      setIsEditing(false);
      checkAdminAndFetchArticle();
    } catch (err: any) { Alert.alert("Erreur", err.message); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    Alert.alert("Suppression", "Confirmer ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: async () => {
            await supabase.from('news').delete().eq('id', id);
            router.back();
        }}
    ]);
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          <View style={styles.card}>
            <Text style={styles.headerTitle}>Modifier l'actualité</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} placeholder="Titre" />
            <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} placeholder="Catégorie" />
            <TextInput style={[styles.input, { height: 100 }]} value={editDescription} onChangeText={setEditDescription} multiline placeholder="Description" textAlignVertical="top" />
            
            <Text style={styles.label}>Choisir une image existante :</Text>
            <FlatList 
              data={serverImages} 
              horizontal 
              keyExtractor={(item) => item}
              renderItem={({item}) => (
                <TouchableOpacity onPress={() => setEditImageUri(item)}>
                  <Image source={{uri: item}} style={[styles.miniImage, editImageUri === item && styles.activeImage]} />
                </TouchableOpacity>
              )} 
              style={{ marginBottom: 15 }}
            />

            <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
              <Text style={styles.btnText}>Ou importer une nouvelle photo</Text>
            </TouchableOpacity>

            {(editImageUri || article?.image_url) && (
              <Image source={{ uri: editImageUri || article?.image_url }} style={styles.articleImage} />
            )}
            
            <TouchableOpacity style={styles.btnSuccess} onPress={handleUpdate}>
              <Text style={styles.btnText}>ENREGISTRER</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(false)} style={{marginTop: 15, alignItems: 'center'}}>
                <Text style={{color: '#9CA3AF'}}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {article?.image_url && <Image source={{ uri: article.image_url }} style={styles.articleImage} />}
            <Text style={styles.title}>{article?.title}</Text>
            <Text style={styles.text}>{article?.description}</Text>
            
            {isAdmin && (
              <View style={styles.adminActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                  <Text style={styles.btnText}>Modifier l'article</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.btnText}>Supprimer l'article</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  scrollContent: { paddingBottom: 40 },
  card: { backgroundColor: '#0F2241', margin: 15, padding: 20, borderRadius: 16 },
  headerTitle: { color: '#C5A059', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  articleImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  input: { backgroundColor: '#FFF', padding: 12, marginBottom: 10, borderRadius: 5, color: '#000' },
  label: { color: '#C5A059', fontSize: 12, marginBottom: 5 },
  miniImage: { width: 70, height: 70, marginRight: 10, borderRadius: 5 },
  activeImage: { borderWidth: 2, borderColor: '#10B981' },
  imagePickerBtn: { backgroundColor: '#4B5563', padding: 15, alignItems: 'center', marginBottom: 15, borderRadius: 5 },
  btnSuccess: { backgroundColor: '#10B981', padding: 15, alignItems: 'center', borderRadius: 5 },
  editBtn: { backgroundColor: '#3B82F6', padding: 15, marginHorizontal: 20, marginTop: 20, alignItems: 'center', borderRadius: 5 },
  deleteBtn: { backgroundColor: '#EF4444', padding: 15, margin: 20, alignItems: 'center', borderRadius: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold', padding: 20 },
  text: { color: '#CCC', paddingHorizontal: 20, fontSize: 16 },
  adminActions: { marginTop: 20 }
});