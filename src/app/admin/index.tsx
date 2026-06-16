import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

function AdminDashboard() {
  const router = useRouter();
  
  // 🛡️ GARDE DE SÉCURITÉ POUR EXPO ROUTER
  const [isMounted, setIsMounted] = useState(false);

  // ÉTATS GESTION LICENCIÉS (IMPORTATION EN BLOC)
  const [bulkData, setBulkData] = useState('');
  const [loadingWhiteList, setLoadingWhiteList] = useState(false);

  // ÉTATS GESTION LICENCIÉ (MANUEL INDIVIDUEL)
  const [manualNom, setManualNom] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [loadingSingle, setLoadingSingle] = useState(false);

  // ÉTATS GESTION ACTUALITÉS
  const [actuTitle, setActuTitle] = useState('');
  const [actuCategory, setActuCategory] = useState('SÉNIORS');
  const [actuDescription, setActuDescription] = useState('');
  const [loadingActu, setLoadingActu] = useState(false);
  
  // ÉTATS POUR LES PHOTOS
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isExistingImage, setIsExistingImage] = useState(false); 
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serverImages, setServerImages] = useState<string[]>([]); 
  const [loadingServerImages, setLoadingServerImages] = useState(false);

  // 🔄 CHARGER LES IMAGES EXISTANTES DANS LE STORAGE SUPABASE
  const fetchServerImages = async () => {
    setLoadingServerImages(true);
    try {
      const { data, error } = await supabase.storage.from('news-images').list('', {
        limit: 20,
        sortBy: { column: 'created_at', order: 'desc' },
      });

      if (error) throw error;

      if (data) {
        const urls = data
          .filter(file => file.name !== '.emptyFolderPlaceholder') 
          .map(file => {
            const { data: publicData } = supabase.storage.from('news-images').getPublicUrl(file.name);
            return publicData.publicUrl;
          });
        setServerImages(urls);
      }
    } catch (err) {
      console.error("Erreur récupération images serveur:", err);
    } finally {
      setLoadingServerImages(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchServerImages();
  }, []);

  if (!isMounted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  // SÉLECTIONNER UNE NOUVELLE PHOTO DEPUIS LA GALERIE DU TÉLÉPHONE
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert("Désolé, nous avons besoin des permissions pour accéder à tes photos !");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setSelectedImageUri(result.assets[0].uri);
      setIsExistingImage(false); 
    }
  };

  // SÉLECTIONNER UNE IMAGE DÉJÀ EXISTANTE SUR LE SERVEUR
  const handleSelectServerImage = (url: string) => {
    setSelectedImageUri(url);
    setIsExistingImage(true); 
  };

  // TÉLÉVERSER UNE PHOTO VERS SUPABASE STORAGE
  const uploadImageToStorage = async (uri: string): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `${fileName}`;

      const LegacyFileSystem = require('expo-file-system/legacy');
      const base64 = await LegacyFileSystem.readAsStringAsync(uri, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });

      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const arrayBuffer = bytes.buffer;

      const { error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('news-images').getPublicUrl(filePath);
      return data.publicUrl;

    } catch (error: any) {
      console.error("Erreur upload storage:", error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // 🚀 IMPORTATION EN BLOC (EXCEL)
  const handleImportBulkLicencies = async () => {
    if (!bulkData.trim()) { 
      Alert.alert("Saisie vide", "Veuillez coller du texte avant de valider."); 
      return; 
    }
    
    setLoadingWhiteList(true);
    try {
      const { data: existingLicencies, error: fetchError } = await supabase
        .from('licencies_autorises')
        .select('email');

      if (fetchError) throw new Error("Impossible de lire la base : " + fetchError.message);

      const existingEmails = new Set(existingLicencies?.map(l => l.email.toLowerCase().trim()) || []);
      const lines = bulkData.split('\n');
      const rowsToInsert: { email: string; nom_prenom: string; est_admin: boolean }[] = [];
      let skippedCount = 0;

      lines.forEach((line, index) => {
        const cleanLine = line.trim();
        if (!cleanLine) return;

        const columns = cleanLine.split(/[\t;]+/);
        let email = columns.find(col => col.includes('@'))?.toLowerCase().trim();
        
        if (!email) {
          const emailMatch = cleanLine.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) email = emailMatch[0].toLowerCase().trim();
        }

        let nomPrenom = '';
        if (email) {
          nomPrenom = cleanLine.replace(email, '').replace(/[\t;]+/g, ' ').trim();
        } else {
          nomPrenom = cleanLine.replace(/[\t;]+/g, ' ').trim();
        }

        if (!nomPrenom) nomPrenom = "Licencié Importé #" + (index + 1);

        if (!email) {
          const sanitizedName = nomPrenom
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, ".");
          email = `${sanitizedName}@usbelleu.tmp`;
        }

        if (!existingEmails.has(email) && !rowsToInsert.some(row => row.email === email)) {
          rowsToInsert.push({ email, nom_prenom: nomPrenom, est_admin: false });
        } else {
          skippedCount++;
        }
      });

      if (rowsToInsert.length === 0) {
        Alert.alert("Analyse terminée", "Tous les licenciés indiqués possèdent déjà un accès.");
        setLoadingWhiteList(false);
        return;
      }

      const { error: insertError } = await supabase.from('licencies_autorises').insert(rowsToInsert);
      if (insertError) throw insertError;

      Alert.alert("✅ Importation réussie", `${rowsToInsert.length} licencié(s) ajouté(s).` + (skippedCount > 0 ? ` (${skippedCount} ignoré(s))` : ''));
      setBulkData(''); 

    } catch (error: any) {
      Alert.alert("❌ Erreur", error.message);
    } finally {
      setLoadingWhiteList(false);
    }
  };

  // 👤 AJOUT MANUEL INDIVIDUEL (FORMULAIRE UNIQUE)
  const handleImportSingleLicencie = async () => {
    if (!manualNom.trim()) {
      Alert.alert("Champs requis", "Veuillez au moins renseigner le Nom et le Prénom du licencié.");
      return;
    }

    setLoadingSingle(true);
    try {
      let finalEmail = manualEmail.trim().toLowerCase();
      const finalNom = manualNom.trim();

      if (!finalEmail) {
        const sanitizedName = finalNom
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, ".");
        finalEmail = `${sanitizedName}@usbelleu.tmp`;
      }

      const { data: duplicateCheck, error: checkError } = await supabase
        .from('licencies_autorises')
        .select('id')
        .eq('email', finalEmail)
        .maybeSingle();

      if (checkError) throw checkError;

      if (duplicateCheck) {
        Alert.alert("Déjà inscrit", `L'adresse email "${finalEmail}" possède déjà un accès dans l'application.`);
        setLoadingSingle(false);
        return;
      }

      const { error: insertError } = await supabase.from('licencies_autorises').insert([
        {
          email: finalEmail,
          nom_prenom: finalNom,
          est_admin: false
        }
      ]);

      if (insertError) throw insertError;

      Alert.alert("✅ Licencié ajouté", `${finalNom} a été enregistré avec succès.`);
      setManualNom('');
      setManualEmail('');

    } catch (error: any) {
      Alert.alert("❌ Erreur d'ajout", error.message);
    } finally {
      setLoadingSingle(false);
    }
  };

  // PUBLIER UNE ACTUALITÉ
  const handlePublishActu = async () => {
    if (!actuTitle || !actuDescription) { Alert.alert("Champs requis", "Veuillez remplir le titre et le contenu."); return; }
    setLoadingActu(true);

    let finalImageUrl = null;

    try {
      if (selectedImageUri) {
        if (isExistingImage) {
          finalImageUrl = selectedImageUri;
        } else {
          finalImageUrl = await uploadImageToStorage(selectedImageUri);
          if (!finalImageUrl) {
            Alert.alert("Attention", "La photo n'a pas pu être envoyée, l'article sera publié sans image.");
          }
        }
      }

      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      const dateAujourdhui = new Date().toLocaleDateString('fr-FR', options);
      const couleursActu = ['#1E3A8A', '#065F46', '#991B1B', '#374151', '#5B21B6'];
      const randomColor = couleursActu[Math.floor(Math.random() * couleursActu.length)];

      const { error } = await supabase.from('news').insert([
        { 
          title: actuTitle.trim(), 
          category: actuCategory.toUpperCase(), 
          description: actuDescription.trim(), 
          date: dateAujourdhui, 
          color: randomColor,
          image_url: finalImageUrl
        }
      ]);

      if (error) throw error;
      
      Alert.alert("📢 Succès", "L'actualité a été publiée sur le fil d'actualités !");
      setActuTitle(''); 
      setActuDescription('');
      setSelectedImageUri(null);
      setIsExistingImage(false);
      
      fetchServerImages();

    } catch (error: any) { 
      Alert.alert("Erreur", "Impossible de publier l'article : " + error.message); 
    } finally { 
      setLoadingActu(false); 
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Retour App</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>PANNEAU DE CONTRÔLE ADMIN</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            
            {/* GESTION CALENDRIER ÉVÉNEMENTIEL */}
            <View style={styles.cardAdmin}>
              <Text style={styles.sectionTitle}>📆 Calendrier Événementiel</Text>
              <Text style={styles.label}>Planifier les tournois, réunions, stages et festivités globales du club :</Text>
              <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#C5A059', marginTop: 10 }]} onPress={() => router.push('/admin/calendrier-gestion')}>
                <Text style={styles.submitButtonText}>OUVRIR LE GESTIONNAIRE</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* GESTION DES SPONSORS */}
            <View style={styles.cardAdmin}>
              <Text style={styles.sectionTitle}>🤝 Gestion des Sponsors & Partenaires</Text>
              <Text style={styles.label}>Ajouter les logos des entreprises et gérer les liens internet de nos partenaires :</Text>
              <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#C5A059', marginTop: 10 }]} onPress={() => router.push('/admin/add-sponsor')}>
                <Text style={styles.submitButtonText}>OUVRIR LE GESTIONNAIRE DES SPONSORS</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* GESTION DES ADMINISTRATEURS */}
            <View style={styles.cardAdmin}>
              <Text style={styles.sectionTitle}>🛡️ Gestion des Droits Administrateurs</Text>
              <Text style={styles.label}>Activer ou révoquer instantanément les droits d'administration de vos licenciés :</Text>
              <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#C5A059', marginTop: 10 }]} onPress={() => router.push('/admin/users')}>
                <Text style={styles.submitButtonText}>GÉRER LES ADMINISTRATEURS</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* EXPÉDITION FIL ACTUALITÉS */}
            <View style={styles.cardAdmin}>
              <Text style={styles.sectionTitle}>📢 Publier une Actualité</Text>
              
              <TextInput style={styles.input} placeholder="Titre de l'actualité" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={actuTitle} onChangeText={setActuTitle} />
              <TextInput style={styles.input} placeholder="Catégorie (Ex: SÉNIORS, JEUNES...)" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={actuCategory} onChangeText={setActuCategory} />
              
              {/* MINI CARROUSEL : PHOTOS DU SERVEUR */}
              <Text style={styles.label}>1. Réutiliser une image existante du club :</Text>
              {loadingServerImages ? (
                <ActivityIndicator color="#C5A059" style={{ marginVertical: 10 }} />
              ) : (
                <FlatList
                  data={serverImages}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={{ paddingVertical: 5, marginBottom: 10 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      onPress={() => handleSelectServerImage(item)}
                      style={[
                        styles.serverImageWrapper, 
                        selectedImageUri === item && styles.serverImageWrapperActive
                      ]}
                    >
                      <Image source={{ uri: item }} style={styles.serverMiniImage} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyImagesText}>Aucune image disponible sur le serveur.</Text>}
                />
              )}

              {/* TÉLÉPHONE LOCAL */}
              <Text style={styles.label}>2. OU Importer une nouvelle image :</Text>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
                <Text style={styles.imagePickerBtnText}>🖼 Importer depuis votre pellicule</Text>
              </TouchableOpacity>

              {/* Aperçu */}
              {selectedImageUri && (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: selectedImageUri }} style={styles.previewImage} />
                  <View style={styles.originBadge}>
                    <Text style={styles.originBadgeText}>
                      {isExistingImage ? "☁️ Image du serveur" : "📱 Nouvelle image locale"}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.deleteImageBtn} onPress={() => { setSelectedImageUri(null); setIsExistingImage(false); }}>
                    <Text style={styles.deleteImageText}>Enlever X</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TextInput style={[styles.input, styles.textArea]} placeholder="Contenu de l'article..." placeholderTextColor="rgba(255, 255, 255, 0.5)" value={actuDescription} onChangeText={setActuDescription} multiline numberOfLines={4} />
              
              <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#10B981' }]} onPress={handlePublishActu} disabled={loadingActu || uploadingImage}>
                {loadingActu || uploadingImage ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>PUBLIER L'ARTICLE</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.separator} />

            {/* GESTION DES ACCÈS (BLOC ET INDIVIDUEL) */}
            <View style={styles.cardAdmin}>
              <Text style={styles.sectionTitle}>🏃‍♂️ Autoriser les licenciés (Accès Application)</Text>
              
              {/* OPTION 1 : LE COPIER COLLER DE BLOC */}
              <Text style={[styles.label, { fontWeight: 'bold', color: '#C5A059' }]}>Option A : En bloc via un export (Excel / Footclubs)</Text>
              <Text style={styles.label}>
                Sélectionnez vos colonnes (Nom, Prénom, Email), copiez-les et collez-les directement ci-dessous :
              </Text>

              <TextInput 
                style={[styles.input, styles.textArea, { height: 100, fontSize: 13, marginBottom: 10 }]} 
                placeholder="Collez vos lignes Excel ici..." 
                placeholderTextColor="rgba(255, 255, 255, 0.4)" 
                value={bulkData} 
                onChangeText={setBulkData} 
                multiline 
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#C5A059', height: 40, marginBottom: 20 }]} onPress={handleImportBulkLicencies} disabled={loadingWhiteList}>
                {loadingWhiteList ? <ActivityIndicator color="#0F2241" /> : <Text style={[styles.submitButtonText, { fontSize: 12 }]}>VALIDER LE BLOC EXCEL</Text>}
              </TouchableOpacity>

              {/* PETITE LIGNE DE SÉPARATION INTERNE */}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 }} />

              {/* OPTION 2 : L'AJOUT INDIVIDUEL MANUEL */}
              <Text style={[styles.label, { fontWeight: 'bold', color: '#C5A059', marginTop: 10 }]}>Option B : Ajouter manuellement un seul licencié</Text>
              
              <TextInput 
                style={[styles.input, { height: 40, marginBottom: 10, fontSize: 13 }]} 
                placeholder="Nom Prénom du joueur" 
                placeholderTextColor="rgba(255, 255, 255, 0.4)" 
                value={manualNom} 
                onChangeText={setManualNom}
              />

              <TextInput 
                style={[styles.input, { height: 40, marginBottom: 12, fontSize: 13 }]} 
                placeholder="Adresse e-mail (Optionnel, génère un compte temporaire si vide)" 
                placeholderTextColor="rgba(255, 255, 255, 0.4)" 
                value={manualEmail} 
                onChangeText={setManualEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />

              <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#10B981', height: 40 }]} onPress={handleImportSingleLicencie} disabled={loadingSingle}>
                {loadingSingle ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.submitButtonText, { color: '#FFFFFF', fontSize: 12 }]}>AJOUTER CE LICENCIÉ</Text>}
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B' },
  scrollView: { flex: 1, backgroundColor: '#061329' },
  header: { backgroundColor: '#1E293B', paddingVertical: 15, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' },
  backButton: { position: 'absolute', left: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  backButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#C5A059', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  content: { padding: 15, maxWidth: 450, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  cardAdmin: { backgroundColor: '#0F2241', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { color: '#C5A059', fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 8, marginTop: 5, lineHeight: 18 },
  input: { width: '100%', height: 50, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 15, color: '#FFFFFF', marginBottom: 15, backgroundColor: 'rgba(255, 255, 255, 0.02)', justifyContent: 'center' },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  
  serverImageWrapper: { marginRight: 10, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  serverImageWrapperActive: { borderColor: '#C5A059' },
  serverMiniImage: { width: 70, height: 70, resizeMode: 'cover' },
  emptyImagesText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontStyle: 'italic', marginVertical: 5 },

  imagePickerBtn: { width: '100%', height: 45, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  imagePickerBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  previewContainer: { width: '100%', height: 160, marginBottom: 15, position: 'relative', borderRadius: 10, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
  deleteImageText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  
  originBadge: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(15, 34, 65, 0.9)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  originBadgeText: { color: '#C5A059', fontSize: 11, fontWeight: 'bold' },

  submitButton: { width: '100%', height: 50, backgroundColor: '#C5A059', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#0F2241', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  separator: { height: 25 }
});

export default AdminDashboard;