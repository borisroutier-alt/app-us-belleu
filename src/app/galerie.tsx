import { useRouter } from 'expo-router'; // 👈 Importation du routeur
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';

interface Commentaire {
  id: string;
  commentaire: string;
  id_utilisateur: string;
  nom_auteur: string;
}

interface PhotoClub {
  id: string;
  url: string;
  cree_le: string;
  id_utilisateur: string;
  likes_count: number;
  user_has_liked: boolean;
  commentaires: Commentaire[];
}

const { width } = Dimensions.get('window');

const GalerieFeedScreen: React.FC = () => {
  const router = useRouter(); // 👈 Initialisation du routeur
  const [photos, setPhotos] = useState<PhotoClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIdentity, setCurrentUserIdentity] = useState<string>("Membre");
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // 👈 État pour vérifier si admin
  const [nouveauCommentaire, setNouveauCommentaire] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const preparerUtilisateur = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      if (user.email) {
        try {
          const { data: licence } = await supabase
            .from('licencies_autorises')
            .select('nom_prenom, est_admin') // 👈 Récupération du rôle d'admin
            .eq('email', user.email.toLowerCase().trim())
            .maybeSingle();
          
          if (licence) {
            if (licence.nom_prenom) setCurrentUserIdentity(licence.nom_prenom);
            if (licence.est_admin) setIsAdmin(true); // 👈 Activation des droits admin
          }
        } catch (err) {
          console.error("Erreur récupération identité :", err);
        }
      }
    };

    preparerUtilisateur();
    fetchFeed();
  }, [currentUserId]);

  const fetchFeed = async () => {
    try {
      const { data: photosData, error: photosError } = await supabase
        .from('photos_club')
        .select('id, url, cree_le, id_utilisateur')
        .order('cree_le', { ascending: false });

      if (photosError) throw photosError;
      if (!photosData) return;

      const feedComplet = await Promise.all(
        photosData.map(async (photo) => {
          const { count: likesCount } = await supabase
            .from('photos_likes')
            .select('*', { count: 'exact', head: true })
            .eq('id_photo', photo.id);

          let hasLiked = false;
          if (currentUserId) {
            const { data: likeData } = await supabase
              .from('photos_likes')
              .select('id')
              .eq('id_photo', photo.id)
              .eq('id_utilisateur', currentUserId)
              .maybeSingle();
            if (likeData) hasLiked = true;
          }

          const { data: comsData } = await supabase
            .from('photos_commentaires')
            .select('id, commentaire, id_utilisateur, nom_auteur')
            .eq('id_photo', photo.id)
            .order('cree_le', { ascending: true });

          return {
            ...photo,
            likes_count: likesCount || 0,
            user_has_liked: hasLiked,
            commentaires: comsData || []
          };
        })
      );

      setPhotos(feedComplet);
    } catch (error: any) {
      console.error("Erreur chargement fil :", error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

// 🚀 SUPPRESSION D'UNE PUBLICATION EN FORÇANT LA CAPTURE D'ERREUR BDD
  const handleDeletePost = async (photoId: string, imageUrl: string) => {
    Alert.alert(
      "Supprimer la publication ?",
      "Cette action retirera définitivement la photo du fil du club ainsi que ses likes et commentaires associés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const urlParts = imageUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];

              if (fileName) {
                await supabase.storage
                  .from('news-images')
                  .remove([fileName]);
              }

              // Nettoyage manuel des tables associées
              await supabase.from('photos_likes').delete().eq('id_photo', photoId);
              await supabase.from('photos_commentaires').delete().eq('id_photo', photoId);
              
              // C'est cette ligne qui bloque si les RLS ou les clés étrangères refusent
              const { error: dbError } = await supabase
                .from('photos_club')
                .delete()
                .eq('id', photoId);

              if (dbError) {
                // Si Supabase renvoie une erreur, on l'envoie direct dans le catch
                throw new Error(dbError.message);
              }

              // On ne met à jour l'écran LOCAL que si la BDD a accepté
              setPhotos(prev => prev.filter(p => p.id !== photoId));
              Alert.alert("Supprimé", "La publication a été retirée avec succès.");

            } catch (err: any) {
              // Cette alerte te donnera le vrai motif (ex: "policy violates...", "foreign key violation...")
              Alert.alert("Erreur de suppression BDD", err.message);
            }
          }
        }
      ]
    );
  };

  // 💬 MODÉRATION : SUPPRESSION D'UN COMMENTAIRE AVEC CAPTURE D'ERREUR BDD
  const handleDeleteCommentaire = async (photoId: string, commentaireId: string) => {
    Alert.alert(
      "Modération du commentaire",
      "Es-tu sûr de vouloir supprimer définitivement ce commentaire ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error: dbError } = await supabase
                .from('photos_commentaires')
                .delete()
                .eq('id', commentaireId);

              if (dbError) {
                throw new Error(dbError.message);
              }

              // On filtre localement UNIQUEMENT si Supabase a validé la suppression
              setPhotos(prev => prev.map(p => {
                if (p.id === photoId) {
                  return {
                    ...p,
                    commentaires: p.commentaires.filter(c => c.id !== commentaireId)
                  };
                }
                return p;
              }));

              Alert.alert("Succès", "Le commentaire a été supprimé.");

            } catch (err: any) {
              Alert.alert("Erreur de suppression Commentaire", err.message);
            }
          }
        }
      ]
    );
  };

  const handleLike = async (photoId: string, alreadyLiked: boolean) => {
    if (!currentUserId) return;
    try {
      if (alreadyLiked) {
        await supabase.from('photos_likes').delete().eq('id_photo', photoId).eq('id_utilisateur', currentUserId);
      } else {
        await supabase.from('photos_likes').insert([{ id_photo: photoId, id_utilisateur: currentUserId }]);
      }
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, user_has_liked: !alreadyLiked, likes_count: alreadyLiked ? p.likes_count - 1 : p.likes_count + 1 } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAjouterCommentaire = async (photoId: string) => {
    const texte = nouveauCommentaire[photoId]?.trim();
    if (!texte || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('photos_commentaires')
        .insert([
          { 
            id_photo: photoId, 
            id_utilisateur: currentUserId, 
            commentaire: texte,
            nom_auteur: currentUserIdentity
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, commentaires: [...p.commentaires, data] } : p));
      setNouveauCommentaire(prev => ({ ...prev, [photoId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚽ LE FIL DU CLUB</Text>
        <View style={styles.placeholderRight} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C5A059" />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#C5A059" />}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              
              {/* Image avec bouton de suppression absolu */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.url }} style={styles.postImage} resizeMode="cover" />
                
                {/* Poubelle de publication pour l'admin */}
                {isAdmin && (
                  <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleDeletePost(item.id, item.url)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.interactionBar}>
                <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id, item.user_has_liked)}>
                  <Text style={styles.likeIcon}>{item.user_has_liked ? '❤️' : '🤍'}</Text>
                  <Text style={styles.interactionText}>{item.likes_count} J'aime</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.commentsSection}>
                {item.commentaires.map((com) => (
                  <TouchableOpacity 
                    key={com.id}
                    // Appui long disponible uniquement pour les admins pour modérer
                    onLongPress={() => isAdmin && handleDeleteCommentaire(item.id, com.id)}
                    delayLongPress={600}
                    disabled={!isAdmin}
                    style={styles.commentRow}
                  >
                    <Text style={styles.commentText}>
                      <Text style={styles.commentUser}>{com.nom_auteur || "Membre"} : </Text>
                      {com.commentaire}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ajouter un commentaire..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={nouveauCommentaire[item.id] || ''}
                    onChangeText={(text) => setNouveauCommentaire(prev => ({ ...prev, [item.id]: text }))}
                  />
                  <TouchableOpacity style={styles.sendButton} onPress={() => handleAjouterCommentaire(item.id)}>
                    <Text style={styles.sendButtonText}>Publier</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { 
    flexDirection: 'row',
    backgroundColor: '#0F2241', 
    paddingVertical: 18, 
    paddingHorizontal: 15,
    alignItems: 'center', 
    justifyContent: 'space-between', // 👈 Corrigé : propriété valide React Native
    borderBottomWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  backButton: { paddingVertical: 4 },
  backText: { color: '#C5A059', fontWeight: 'bold', fontSize: 14 },
  title: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  placeholderRight: { width: 60 }, 
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  postCard: { backgroundColor: '#0F2241', marginBottom: 15 },
  imageContainer: { position: 'relative', width: width, height: width * 0.8 }, 
  postImage: { width: '100%', height: '100%' },
  
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)', 
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  deleteButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },

  interactionBar: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  likeButton: { flexDirection: 'row', alignItems: 'center' },
  likeIcon: { fontSize: 20, marginRight: 6 },
  interactionText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  commentsSection: { padding: 15, backgroundColor: 'rgba(0,0,0,0.1)' },
  commentRow: { paddingVertical: 3 }, // 👈 Zone de confort pour l'appui long de modération
  commentText: { color: '#FFFFFF', fontSize: 13 },
  commentUser: { color: '#C5A059', fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#14294E', color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, fontSize: 13 },
  sendButton: { marginLeft: 10, paddingHorizontal: 10 },
  sendButtonText: { color: '#C5A059', fontWeight: 'bold', fontSize: 13 }
});

export default GalerieFeedScreen;