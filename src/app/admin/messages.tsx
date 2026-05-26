import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- CORRECTION 1 : Import de la SafeAreaView
import { supabase } from '../../supabaseClient';

interface MessageContact {
  id: string;
  nom_complet: string;
  sujet: string;
  message: string;
  destinataire: string;
  created_at: string;
}

export default function AdminMessagesScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    verifierEtChargerMessages();
  }, []);

  const verifierEtChargerMessages = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        setTimeout(() => {
          Alert.alert("Non connecté", "Veuillez vous connecter pour accéder à cette page.");
          router.replace('/');
        }, 0);
        return;
      }

      const { data: licence } = await supabase
        .from('licencies_autorises')
        .select('est_admin')
        .eq('email', user.email.toLowerCase().trim())
        .maybeSingle();

      if (!licence?.est_admin) {
        setTimeout(() => {
          Alert.alert("Accès refusé", "Vous devez être administrateur pour voir cette page.");
          router.replace('/');
        }, 0);
        return;
      }

      await fetchMessages();
    } catch (err: any) {
      setTimeout(() => {
        Alert.alert("Erreur", err.message);
      }, 0);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages_contact')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert("Erreur de chargement", error.message);
    } else {
      setMessages(data || []);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const handleSupprimerMessage = (id: string) => {
    Alert.alert(
      "Archiver le message ?",
      "Le message sera définitivement supprimé de la liste des demandes.",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Supprimer", 
          style: "destructive", 
          onPress: async () => {
            const { error } = await supabase
              .from('messages_contact')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert("Erreur", "Impossible de supprimer : " + error.message);
            } else {
              setMessages(prev => prev.filter(msg => msg.id !== id));
            }
          }
        }
      ]
    );
  };

  const getBadgeColor = (dest: string) => {
    switch (dest) {
      case 'Président': return '#EF4444';
      case 'Secrétaire': return '#3B82F6';
      case 'Directeur Sportif': return '#10B981';
      default: return '#71717a';
    }
  };

  const formaterDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C5A059" />
      </View>
    );
  }

  return (
    // CORRECTION 2 : Encapsulation globale dans la SafeAreaView avec la couleur officielle du club
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <View style={styles.container}>
        {/* EN-TÊTE HARMONISÉ */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>⬅ Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📥 MESSAGERIE SECRÉTARIAT</Text>
          <Text style={styles.subtitle}>{messages.length} message(s) reçu(s)</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A059" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>📭 Aucun message reçu pour le moment.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.messageCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: getBadgeColor(item.destinataire) }]}>
                  <Text style={styles.badgeText}>{item.destinataire.toUpperCase()}</Text>
                </View>
                <Text style={styles.dateText}>{formaterDate(item.created_at)}</Text>
              </View>

              <Text style={styles.senderText}>De : <Text style={styles.boldText}>{item.nom_complet}</Text></Text>
              <Text style={styles.sujetText}>Sujet : <Text style={styles.boldText}>{item.sujet}</Text></Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.bodyText}>{item.message}</Text>

              <TouchableOpacity 
                style={styles.archiveButton} 
                onPress={() => handleSupprimerMessage(item.id)}
              >
                <Text style={styles.archiveButtonText}>✅ Marquer comme traité / Archiver</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // CORRECTION 3 : Style pour la zone de sécurité haute aux couleurs exactes du club
  safeContainer: { flex: 1, backgroundColor: '#14294E' },
  container: { flex: 1, backgroundColor: '#061329' },
  center: { flex: 1, backgroundColor: '#061329', justifyContent: 'center', alignItems: 'center' },
  
  // CORRECTION 4 : Remplacement de l'ancien bleu #0F2241 par le bleu officiel #14294E
  header: { padding: 20, backgroundColor: '#14294E', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 10 },
  backText: { color: '#C5A059', fontWeight: 'bold', fontSize: 12 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 2 },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' },
  
  // Remplacement également sur les cartes pour conserver l'harmonie des bleus
  messageCard: { backgroundColor: '#14294E', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dateText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  senderText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 2 },
  sujetText: { color: '#FFFFFF', fontSize: 14, marginBottom: 10 },
  boldText: { fontWeight: 'bold', color: '#FFF' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 8 },
  bodyText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  archiveButton: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 1, borderColor: '#10B981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  archiveButtonText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' }
});