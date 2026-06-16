import { decode } from 'base64-arraybuffer';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

interface Sponsor {
  id: string;
  name: string;
  description: string;
  image_url: string;
  website_url?: string;
  is_active: boolean;
}

export default function AdminSponsorsScreen() {
  const router = useRouter();

  // États du formulaire
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // États globaux
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSponsors();
  }, []);

  // 🔄 Charger les sponsors depuis Supabase
  const fetchSponsors = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de récupérer les partenaires : " + error.message);
    } finally {
      setFetching(false);
    }
  };

  // 📸 Sélectionner le visuel
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission requise", "Vous devez autoriser l'accès aux photos pour ajouter un logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, 
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ☁️ Téléverser l'image vers Storage
  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `sponsor_${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const base64Data = await LegacyFileSystem.readAsStringAsync(uri, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });

      const arrayBuffer = decode(base64Data);

      const { error: uploadError } = await supabase.storage
        .from('sponsors-bucket') 
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('sponsors-bucket').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error: any) {
      console.error("Erreur upload image :", error);
      Alert.alert("Erreur d'envoi", "Impossible de téléverser l'image : " + error.message);
      return null;
    }
  };

  // 💾 SAUVEGARDE (Insertion ou Mise à jour en base de données)
  const handleSaveSponsor = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert("Champs requis", "Veuillez donner un nom et une description au partenaire.");
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = imageUri;

      // Détecter s'il s'agit d'une nouvelle image locale à uploader
      if (imageUri && (imageUri.startsWith('file://') || imageUri.startsWith('ph://') || imageUri.startsWith('content://'))) {
        const uploadedUrl = await uploadImage(imageUri);
        if (!uploadedUrl) throw new Error("Échec de l'envoi de l'image.");
        finalImageUrl = uploadedUrl;
      }

      if (!finalImageUrl) {
        Alert.alert("Image requise", "Veuillez sélectionner un visuel ou une carte pour le sponsor.");
        setLoading(false);
        return;
      }

      const sponsorData = {
        name: name.trim(),
        description: description.trim(),
        website_url: websiteUrl.trim() || null,
        image_url: finalImageUrl,
        is_active: isActive
      };

      if (editingId) {
        // ✏️ Mode Modification (UPDATE)
        const { error } = await supabase
          .from('sponsors')
          .update(sponsorData)
          .eq('id', editingId);

        if (error) throw error;
        Alert.alert("Succès", "Partenaire mis à jour avec succès !");
      } else {
        // 🤝 Mode Création (INSERT)
        const { error } = await supabase
          .from('sponsors')
          .insert([sponsorData]);

        if (error) throw error;
        Alert.alert("Succès", "Nouveau partenaire ajouté !");
      }

      resetForm();
      fetchSponsors();
    } catch (error: any) {
      Alert.alert("Erreur", "Action impossible : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ✏️ Action : Charger les données d'un sponsor dans le formulaire pour édition
  const handleEdit = (sponsor: Sponsor) => {
    setEditingId(sponsor.id);
    setName(sponsor.name);
    setDescription(sponsor.description);
    setWebsiteUrl(sponsor.website_url || '');
    setImageUri(sponsor.image_url);
    setIsActive(sponsor.is_active);
  };

  // 🗑️ Action : Suppression définitive du sponsor après confirmation
  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirmation de suppression",
      "Voulez-vous vraiment retirer définitivement ce partenaire de l'application ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sponsors')
                .delete()
                .eq('id', id);

              if (error) throw error;
              
              Alert.alert("Supprimé", "Le partenaire a bien été retiré.");
              fetchSponsors();
              
              // Si on était en train de modifier ce sponsor précis, on nettoie le formulaire
              if (editingId === id) resetForm();
            } catch (error: any) {
              Alert.alert("Erreur de suppression", error.message);
            }
          } 
        }
      ]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setWebsiteUrl('');
    setImageUri(null);
    setIsActive(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>ADMINISTRER SPONSORS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* FORMULAIRE UNIQUE (AJOUT / MODIFICATION) */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? "✏️ Mode Édition : Modifier le partenaire" : "🤝 Ajouter un nouveau partenaire"}
          </Text>

          <Text style={styles.label}>Nom de l'entreprise</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Boulangerie Du Centre" 
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Description / Slogan</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Ex: Artisan boulanger, ouvert 7j/7" 
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Lien internet ou Facebook (Optionnel)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="https://..." 
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            keyboardType="url"
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
          />

          <Text style={styles.label}>Logo ou Visuel / Carte de visite</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <Text style={styles.pickerText}>📷 Sélectionner une image ou une carte</Text>
            )}
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Afficher publiquement l'onglet</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#C5A059" }}
              thumbColor={isActive ? "#FFFFFF" : "#f4f3f4"}
              value={isActive}
              onValueChange={setIsActive}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSaveSponsor} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#0F2241" />
            ) : (
              <Text style={styles.submitBtnText}>
                {editingId ? "💾 Enregistrer les modifications" : "➕ Sauvegarder le partenaire"}
              </Text>
            )}
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Annuler l'édition (Revenir à l'ajout)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* LISTE DE GESTION */}
        <Text style={styles.sectionTitle}>📋 Liste des partenaires existants ({sponsors.length})</Text>

        {fetching ? (
          <ActivityIndicator size="small" color="#C5A059" style={{ marginTop: 10 }} />
        ) : (
          sponsors.map((item) => (
            <View key={item.id} style={[styles.itemRow, !item.is_active && { opacity: 0.4 }]}>
              <View style={styles.miniLogoContainer}>
                <Image source={{ uri: item.image_url }} style={styles.miniLogo} resizeMode="contain" />
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemTitle}>{item.name} {!item.is_active && "⚠️ (Masqué)"}</Text>
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              </View>
              
              {/* BOUTONS D'ACTIONS RAPIDES */}
              <View style={styles.actionsBox}>
                <TouchableOpacity style={styles.actionEdit} onPress={() => handleEdit(item)}>
                  <Text style={{ fontSize: 14 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionDelete} onPress={() => handleDelete(item.id)}>
                  <Text style={{ fontSize: 14 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2241' },
  header: { 
    backgroundColor: '#0F2241', 
    paddingTop: 10, 
    paddingBottom: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center'
  },
  backButton: { 
    position: 'absolute', 
    left: 15, 
    top: 12, 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  backButtonText: { color: '#C5A059', fontSize: 12, fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#C5A059', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  
  scrollContent: { 
    padding: 16, 
    maxWidth: 500, 
    width: '100%', 
    alignSelf: 'center',
    backgroundColor: '#061329',
    minHeight: '100%' 
  },
  formCard: {
    backgroundColor: '#0F2241',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 25
  },
  formTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: '#C5A059', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#061329',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  
  imagePickerBtn: {
    backgroundColor: '#FFFFFF', 
    borderWidth: 1,
    borderColor: '#C5A059',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    overflow: 'hidden',
    padding: 4
  },
  pickerText: { color: '#0F2241', fontSize: 13, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%' },
  
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingVertical: 5
  },
  switchLabel: { color: '#FFFFFF', fontSize: 13 },
  submitBtn: {
    backgroundColor: '#C5A059',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20
  },
  submitBtnText: { color: '#0F2241', fontWeight: 'bold', fontSize: 15 },
  cancelBtn: { alignItems: 'center', marginTop: 12 },
  cancelBtnText: { color: '#FF4A4A', fontSize: 13, fontWeight: '500' },
  
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 15, opacity: 0.8 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#0F2241',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  
  miniLogoContainer: {
    width: 65,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2
  },
  miniLogo: { width: '100%', height: '100%' },
  
  itemMeta: { flex: 1, marginLeft: 12 },
  itemTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  itemDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 },
  actionsBox: { flexDirection: 'row' },
  actionEdit: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, marginRight: 6 },
  actionDelete: { padding: 8, backgroundColor: 'rgba(255,74,74,0.1)', borderRadius: 6 }
});