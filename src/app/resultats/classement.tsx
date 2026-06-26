import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Equipe {
  id: string;
  nom: string;
  championnat: string;
  url: string;
  emoji: string;
}

export default function ClassementScreen() {
  const router = useRouter();

  // LISTE DES ÉQUIPES DU CLUB
  const equipesClub: Equipe[] = [
    {
      id: 'seniors_a',
      nom: 'SÉNIORS A',
      championnat: 'Départemental 2',
      url: 'https://epreuves.fff.fr/competition/club/561146-union-sportive-belleu/equipe/2025_200861_SEM_1/classement',
      emoji: '⚽'
    },
    {
      id: 'seniors_b',
      nom: 'SÉNIORS B',
      championnat: 'Départemental 5',
      url: 'https://epreuves.fff.fr/competition/club/561146-union-sportive-belleu/equipe/2025_200861_SEM_2/classement',
      emoji: '🥈'
    },
    {
      id: 'u17',
      nom: 'U17 D1',
      championnat: 'U17 D1',
      url: 'https://epreuves.fff.fr/competition/club/561146-union-sportive-belleu/equipe/2025_200861_U17_4/classement',
      emoji: '🔥'
    },
    {
      id: 'u15',
      nom: 'U15 D3',
      championnat: 'U15 D3',
      url: 'https://epreuves.fff.fr/competition/club/561146-union-sportive-belleu/equipe/2025_200861_U15_3/classement',
      emoji: '🏃‍♂️'
    },
    {
      id: 'u13',
      nom: 'U13 D2',
      championnat: 'U13 D2',
      url: 'https://epreuves.fff.fr/competition/club/561146-union-sportive-belleu/equipe/2025_200861_U13_5/classement',
      emoji: '🏃‍♂️'
    },
  ];

  const ouvrirClassement = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: '#0F2241',
        controlsColor: '#C5A059',
        showTitle: true,
      });
    } catch (error) {
      alert("Impossible d'ouvrir le classement pour le moment.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER SIMPLIFIÉ (adapté au navigation par onglets) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>SÉLECTIONNEZ UNE CATÉGORIE</Text>
      </View>

      {/* LISTE DES BOUTONS D'ÉQUIPES */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🏆 Classements FFF</Text>
        
        {equipesClub.map((equipe) => (
          <TouchableOpacity 
            key={equipe.id} 
            style={styles.equipeCard}
            onPress={() => ouvrirClassement(equipe.url)}
            activeOpacity={0.7}
          >
            <View style={styles.emojiContainer}>
              <Text style={styles.equipeEmoji}>{equipe.emoji}</Text>
            </View>
            <View style={styles.equipeTextContainer}>
              <Text style={styles.equipeNom}>{equipe.nom}</Text>
              <Text style={styles.equipeChamp} numberOfLines={1}>{equipe.championnat}</Text>
            </View>
            <Text style={styles.arrowIcon}>➔</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { 
    backgroundColor: '#0F2241', 
    paddingVertical: 20, 
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#C5A059', fontSize: 11, fontWeight: 'bold', marginTop: 4 },
  scrollContent: { 
    padding: 20, 
    maxWidth: 450, 
    width: '100%', 
    alignSelf: 'center'
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 20, opacity: 0.8 },
  equipeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0F2241', 
    borderRadius: 14, 
    padding: 15, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  emojiContainer: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: 'rgba(197, 160, 89, 0.1)', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 15
  },
  equipeEmoji: { fontSize: 20 },
  equipeTextContainer: { flex: 1 },
  equipeNom: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  equipeChamp: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  arrowIcon: { color: '#C5A059', fontSize: 16, fontWeight: 'bold', paddingLeft: 10 }
});