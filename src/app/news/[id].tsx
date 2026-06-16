import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image, // 👈 Ajout de l'import pour gérer l'affichage de l'image
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../supabaseClient';

interface Article {
  id: string;
  category: string;
  title: string;
  date: string;
  description: string;
  emoji: string;
  color: string;
  image_url?: string | null; // 👈 Prise en compte de la colonne image dans l'interface
}

export default function NewsDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // États pour le mode édition
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');

  useEffect(() => {
    checkAdminAndFetchArticle();
  }, [id]);

  const checkAdminAndFetchArticle = async () => {
    try {
      // 1. Vérifier si l'utilisateur est Admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data: licence } = await supabase
          .from('licencies_autorises')
          .select('est_admin')
          .eq('email', user.email.toLowerCase().trim())
          .maybeSingle();
        
        if (licence?.est_admin) setIsAdmin(true);
      }

      // 2. Charger l'actualité
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setArticle(data);
      setEditTitle(data.title);
      setEditDescription(data.description);
      setEditCategory(data.category);
    } catch (err: any) {
      Alert.alert("Erreur", "Impossible de charger l'article : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🛠️ FONCTION : Sauvegarder les modifications
  const handleUpdate = async () => {
    if (!editTitle || !editDescription) {
      Alert.alert("Attention", "Le titre et la description ne peuvent pas être vides.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('news')
        .update({
          title: editTitle,
          description: editDescription,
          category: editCategory,
        })
        .eq('id', id);

      if (error) throw error;

      Alert.alert("Succès", "L'actualité a été mise à jour !");
      setIsEditing(false);
      // Recharger les données locales de l'article
      setArticle(prev => prev ? { ...prev, title: editTitle, description: editDescription, category: editCategory } : null);
    } catch (err: any) {
      Alert.alert("Erreur", "Modification impossible : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ❌ FONCTION : Supprimer l'actualité
  const handleDelete = () => {
    Alert.alert(
      "Supprimer l'actualité ?",
      "Cette action est irréversible. L'article sera retiré du fil d'actualité de tous les licenciés.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('news')
                .delete()
                .eq('id', id);

              if (error) throw error;

              Alert.alert("Supprimé", "L'actualité a bien été supprimée.");
              router.replace('/'); // Retour à l'accueil
            } catch (err: any) {
              Alert.alert("Erreur", "Suppression impossible : " + err.message);
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#FFF' }}>Actualité introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* En-tête avec couleur et Emoji */}
      <View style={[styles.banner, { backgroundColor: article.color }]}>
        <Text style={styles.emoji}>{article.emoji}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Retour</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {isEditing ? (
          // === MODE ÉDITION (ADMIN UNIQUEMENT) ===
          <View style={styles.form}>
            <Text style={styles.label}>Catégorie (ex: SENIORS, U15, CLUB...)</Text>
            <TextInput style={styles.input} value={editCategory} onChangeText={setEditCategory} />

            <Text style={styles.label}>Titre de l'actualité</Text>
            <TextInput style={styles.input} value={editTitle} onChangeText={setEditTitle} />

            <Text style={styles.label}>Texte de l'article</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={editDescription} 
              onChangeText={setEditDescription} 
              multiline
            />

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={handleUpdate}>
                <Text style={styles.btnText}>💾 ENREGISTRER</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setIsEditing(false)}>
                <Text style={styles.btnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // === MODE LECTURE NORMAL ===
          <View>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category}</Text>
            </View>
            
            {/* 📸 COUCHE AFFICHAGE DE LA PHOTO SÉLECTIONNÉE */}
            {article.image_url ? (
              <Image 
                source={{ uri: article.image_url }} 
                style={styles.articleImage} 
                resizeMode="cover"
              />
            ) : null}

            <Text style={styles.title}>{article.title}</Text>
            <Text style={styles.date}>📅 Publié le {article.date}</Text>
            <Text style={styles.description}>{article.description}</Text>

            {/* Barre d'outils Admin affichée tout en bas */}
            {isAdmin && (
              <View style={styles.adminPanel}>
                <Text style={styles.adminTitle}>👑 OPTIONS ADMINISTRATEUR</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => setIsEditing(true)}>
                    <Text style={styles.btnText}>✏️ Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.btnDelete]} onPress={handleDelete}>
                    <Text style={styles.btnText}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  center: { flex: 1, backgroundColor: '#061329', justifyContent: 'center', alignItems: 'center' },
  banner: { width: '100%', height: 180, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  emoji: { fontSize: 70 },
  backButton: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  backText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  content: { padding: 20 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(197, 160, 89, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#C5A059', marginBottom: 15 },
  categoryText: { color: '#C5A059', fontSize: 11, fontWeight: 'bold' },
  
  // 🎨 STYLE POUR METTRE EN VALEUR LA PHOTO DE L'ACTU
  articleImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#0F2241',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },

  title: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  date: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 13, marginBottom: 20 },
  description: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 15, lineHeight: 24 },
  
  // Styles Espace Admin
  adminPanel: { marginTop: 40, padding: 15, backgroundColor: '#0F2241', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(197, 160, 89, 0.3)' },
  adminTitle: { color: '#C5A059', fontWeight: 'bold', fontSize: 12, marginBottom: 12, textAlign: 'center', letterSpacing: 1 },
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  btnEdit: { backgroundColor: '#3b82f6' },
  btnDelete: { backgroundColor: '#ef4444' },
  btnSuccess: { backgroundColor: '#10b981' },
  btnCancel: { backgroundColor: '#4b5563' },
  
  // Styles Formulaire de modification
  form: { width: '100%' },
  label: { color: '#C5A059', fontSize: 12, fontWeight: 'bold', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#0F2241', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: 12, color: '#FFF', fontSize: 15 },
  textArea: { height: 120, textAlignVertical: 'top' }
});