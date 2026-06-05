import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';

interface Evenement {
  id: string;
  titre: string;
  description: string;
  date_evenement: string;
  lieu: string;
  type?: 'match' | 'autre'; // Récupère le type d'événement depuis Supabase
}

const CalendrierClub = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      // Récupération de l'instant présent au format ISO standard pour le nettoyage automatique
      const maintenant = new Date().toISOString();

      const { data, error } = await supabase
        .from('calendrier')
        .select('*')
        .gte('date_evenement', maintenant) // Masque automatiquement les événements passés
        .order('date_evenement', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      alert("Erreur chargement calendrier : " + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatNewDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CALENDRIER DU CLUB</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C5A059" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); fetchEvents(); }} 
              tintColor="#C5A059" 
            />
          }
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun événement de prévu pour le moment. 📆</Text>}
          renderItem={({ item }) => {
            // Configuration dynamique des styles selon le type
            const isMatch = item.type === 'match';
            const accentColor = isMatch ? '#1E3A8A' : '#C5A059'; // Bleu Roi pour Match, Or pour Autre
            const dateTextColor = isMatch ? '#3B82F6' : '#C5A059'; // Version claire pour le texte de la date

            return (
              <View style={[styles.card, { borderColor: accentColor }]}>
                <Text style={[styles.cardDate, { color: dateTextColor }]}>
                  {isMatch ? '⚽ ' : '📆 '}
                  {formatNewDate(item.date_evenement)}
                </Text>
                <Text style={styles.cardTitle}>{item.titre}</Text>
                {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
                <Text style={styles.cardLieu}>📍 {item.lieu}</Text>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#0F2241', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backButton: { marginRight: 15 },
  backText: { color: '#C5A059', fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  emptyText: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#0F2241', padding: 15, borderRadius: 10, marginBottom: 12, borderLeftWidth: 4 },
  cardDate: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'capitalize' },
  cardTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  cardLieu: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 },
});

export default CalendrierClub;