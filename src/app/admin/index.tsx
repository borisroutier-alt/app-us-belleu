import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { uploadImageToStorage } from '../../../utils/imageUpload';
import { supabase } from '../../supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // ÉTATS
  const [actuTitle, setActuTitle] = useState('');
  const [actuCategorie, setActuCategorie] = useState('');
  const [actuDescription, setActuDescription] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isExistingImage, setIsExistingImage] = useState(false);
  const [serverImages, setServerImages] = useState<string[]>([]);
  const [loadingActu, setLoadingActu] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchServerImages();
  }, []);

  const fetchServerImages = async () => {
    const { data } = await supabase.storage.from('news-images').list('', { limit: 20, sortBy: { column: 'created_at', order: 'desc' } });
    if (data) {
      const urls = data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => supabase.storage.from('news-images').getPublicUrl(f.name).data.publicUrl);
      setServerImages(urls);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.7 });
    if (!result.canceled) {
      setSelectedImageUri(result.assets[0].uri);
      setIsExistingImage(false);
    }
  };

  const handlePublishActu = async () => {
    if (!actuTitle || !actuDescription || !selectedImageUri) return Alert.alert("Erreur", "Tous les champs sont requis");
    setLoadingActu(true);
    try {
      let finalImageUrl = isExistingImage ? selectedImageUri : (await uploadImageToStorage(selectedImageUri!) || "");
      await supabase.from('news').insert([{ 
        title: actuTitle, 
        description: actuDescription, 
        image_url: finalImageUrl,
        categorie: actuCategorie 
      }]);
      Alert.alert("Succès", "Actualité publiée");
      setActuTitle(''); setActuCategorie(''); setActuDescription(''); setSelectedImageUri(null);
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setLoadingActu(false); }
  };

  if (!isMounted) return <ActivityIndicator size="large" />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* SECTION ACTUALITÉ */}
        <View style={styles.cardAdmin}>
          <Text style={styles.sectionTitle}>📢 Publier une Actualité</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Titre de l'article" 
            placeholderTextColor="#888"
            value={actuTitle} 
            onChangeText={setActuTitle} 
          />

          <TextInput 
            style={styles.input} 
            placeholder="Catégorie (ex: Match, Club...)" 
            placeholderTextColor="#888"
            value={actuCategorie} 
            onChangeText={setActuCategorie} 
          />
          
          <FlatList 
            data={serverImages} 
            horizontal 
            keyExtractor={(item) => item}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => { setSelectedImageUri(item); setIsExistingImage(true); }}>
                <Image source={{uri: item}} style={[styles.miniImage, selectedImageUri === item && styles.activeImage]} />
              </TouchableOpacity>
            )} 
          />
          
          <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
            <Text style={styles.btnText}>Ou importer une nouvelle image</Text>
          </TouchableOpacity>
          
          <TextInput 
            style={[styles.input, {height: 80}]} 
            placeholder="Contenu détaillé de l'actualité..." 
            placeholderTextColor="#888"
            value={actuDescription} 
            onChangeText={setActuDescription} 
            multiline 
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.submitButton} onPress={handlePublishActu} disabled={loadingActu}>
            {loadingActu ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>PUBLIER L'ARTICLE</Text>}
          </TouchableOpacity>
        </View>

        {/* SECTION CALENDRIER ET SPONSORS */}
        <View style={styles.row}>
          <TouchableOpacity style={[styles.cardAdmin, {flex: 1, marginRight: 5}]} onPress={() => router.push('/admin/calendrier-gestion')}>
            <Text style={styles.sectionTitle}>📆 Calendrier</Text>
            <Text style={styles.btnText}>Gérer les matchs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cardAdmin, {flex: 1, marginLeft: 5}]} onPress={() => router.push('/admin/add-sponsor')}>
            <Text style={styles.sectionTitle}>🤝 Sponsors</Text>
            <Text style={styles.btnText}>Gérer les partenaires</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION ADMINISTRATION */}
        <View style={styles.cardAdmin}>
          <Text style={styles.sectionTitle}>🛡️ Administration</Text>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/admin/users')}>
            <Text style={styles.btnText}>Gérer les droits Administrateurs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/admin/licencies')}>
            <Text style={styles.btnText}>Gérer les nouveaux licenciés</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B' },
  content: { padding: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cardAdmin: { backgroundColor: '#0F2241', borderRadius: 16, padding: 15, marginBottom: 15 },
  input: { backgroundColor: '#FFF', padding: 10, borderRadius: 5, marginBottom: 10, color: '#000' },
  miniImage: { width: 70, height: 70, marginRight: 10, borderRadius: 5 },
  activeImage: { borderWidth: 2, borderColor: '#C5A059' },
  imagePickerBtn: { backgroundColor: '#4B5563', padding: 10, alignItems: 'center', marginBottom: 10, borderRadius: 5 },
  submitButton: { backgroundColor: '#C5A059', padding: 15, alignItems: 'center', borderRadius: 5 },
  navBtn: { backgroundColor: '#374151', padding: 12, borderRadius: 5, marginBottom: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  sectionTitle: { color: '#C5A059', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }
});