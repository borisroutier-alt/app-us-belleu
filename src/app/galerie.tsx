import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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
  const [photos, setPhotos] = useState<PhotoClub[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIdentity, setCurrentUserIdentity] = useState<string>("Membre");
  const [nouveauCommentaire, setNouveauCommentaire] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const preparerUtilisateur = async () => {
      // 1. Récupérer l'utilisateur connecté dans Auth Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // 2. Trouver son identité dans 'licencies_autorises' via la colonne 'nom_prenom'
      if (user.email) {
        try {
          const { data: licence } = await supabase
            .from('licencies_autorises')
            .select('nom_prenom') // 💡 Adapté à ton image_918881.png
            .eq('email', user.email.toLowerCase().trim())
            .maybeSingle();
          
          if (licence && licence.nom_prenom) {
            setCurrentUserIdentity(licence.nom_prenom);
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
          // Compter les likes
          const { count: likesCount } = await supabase
            .from('photos_likes')
            .select('*', { count: 'exact', head: true })
            .eq('id_photo', photo.id);

          // Vérifier si j'ai aimé
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

          // Récupérer les commentaires
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
            nom_auteur: currentUserIdentity // Enregistre le nom_prenom du licencié
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
        <Text style={styles.title}>⚽ LE FIL DU CLUB</Text>
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
              <Image source={{ uri: item.url }} style={styles.postImage} resizeMode="cover" />

              <View style={styles.interactionBar}>
                <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id, item.user_has_liked)}>
                  <Text style={styles.likeIcon}>{item.user_has_liked ? '❤️' : '🤍'}</Text>
                  <Text style={styles.interactionText}>{item.likes_count} J'aime</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.commentsSection}>
                {item.commentaires.map((com) => (
                  <Text key={com.id} style={styles.commentText}>
                    {/* Affiche l'identité réelle stockée dans nom_auteur */}
                    <Text style={styles.commentUser}>{com.nom_auteur || "Membre"} : </Text>
                    {com.commentaire}
                  </Text>
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
  header: { backgroundColor: '#0F2241', padding: 18, alignItems: 'center', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  postCard: { backgroundColor: '#0F2241', marginBottom: 15 },
  postImage: { width: width, height: width * 0.8 },
  interactionBar: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  likeButton: { flexDirection: 'row', alignItems: 'center' },
  likeIcon: { fontSize: 20, marginRight: 6 },
  interactionText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  commentsSection: { padding: 15, backgroundColor: 'rgba(0,0,0,0.1)' },
  commentText: { color: '#FFFFFF', fontSize: 13, marginBottom: 6 },
  commentUser: { color: '#C5A059', fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#14294E', color: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, fontSize: 13 },
  sendButton: { marginLeft: 10, paddingHorizontal: 10 },
  sendButtonText: { color: '#C5A059', fontWeight: 'bold', fontSize: 13 }
});

export default GalerieFeedScreen;