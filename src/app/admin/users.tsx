import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

// Interface corrigée pour correspondre à la colonne "nom_prenom" de ta base
interface Licencie {
  id: string;
  nom_prenom: string;
  email: string;
  est_admin: boolean;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState<Licencie[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetchUsers();
  }, []);

  // Charger la liste des licenciés
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Correction ici : on sélectionne "nom_prenom" et on trie par cette même colonne
      const { data, error } = await supabase
        .from('licencies_autorises')
        .select('id, nom_prenom, email, est_admin')
        .order('nom_prenom', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de charger les utilisateurs : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Basculer le statut Admin (true/false)
  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingId(userId);
      const newStatus = !currentStatus;

      const { error } = await supabase
        .from('licencies_autorises')
        .update({ est_admin: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Mettre à jour l'état localement pour un rendu fluide
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, est_admin: newStatus } : user
        )
      );
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de modifier les droits : " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isMounted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F2241', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>GESTION DES DROITS ADMIN</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>👥 Liste des membres inscrits ({users.length})</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#C5A059" style={{ marginTop: 40 }} />
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
        ) : (
          users.map((user) => (
            <View key={user.id} style={[styles.userCard, user.est_admin && styles.adminCardBorder]}>
              <View style={styles.userInfos}>
                {/* Affichage corrigé utilisant uniquement la propriété unique "nom_prenom" */}
                <Text style={styles.userName}>{user.nom_prenom}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.est_admin && (
                  <View style={styles.badgeAdmin}>
                    <Text style={styles.badgeText}>⭐ Administrateur</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionBox}>
                {updatingId === user.id ? (
                  <ActivityIndicator size="small" color="#C5A059" />
                ) : (
                  <Switch
                    trackColor={{ false: "#767577", true: "#C5A059" }}
                    thumbColor={user.est_admin ? "#FFFFFF" : "#f4f3f4"}
                    value={user.est_admin}
                    onValueChange={() => toggleAdminStatus(user.id, user.est_admin)}
                  />
                )}
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
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 15, opacity: 0.8 },
  
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#0F2241',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  adminCardBorder: {
    borderColor: 'rgba(197, 160, 89, 0.4)',
  },
  userInfos: { flex: 1, paddingRight: 10 },
  userName: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  userEmail: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  
  badgeAdmin: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)'
  },
  badgeText: { color: '#C5A059', fontSize: 11, fontWeight: 'bold' },
  actionBox: { justifyContent: 'center', alignItems: 'center', width: 50 },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40, fontSize: 14 }
});