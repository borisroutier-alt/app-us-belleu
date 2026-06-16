import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';

export interface Sponsor {
  id: string;
  name: string;
  description: string;
  image_url: string;
  website_url?: string;
  is_active: boolean;
}

function SponsorsScreen() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setSponsors(data || []);
    } catch (error: any) {
      alert("Erreur lors du chargement des sponsors : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
  }, []);

  const ouvrirSponsor = async (url?: string) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: '#0F2241',
        controlsColor: '#C5A059',
        showTitle: true,
      });
    } catch (error) {
      alert("Impossible d'ouvrir le site du partenaire pour le moment.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER DE LA PAGE */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>NOS PARTENAIRES</Text>
      </View>

      {/* LISTE DES PARTENAIRES DÉFILANTE */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🤝 Ils soutiennent le club</Text>
        
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#C5A059" />
            <Text style={styles.loadingText}>Connexion au Cloud...</Text>
          </View>
        ) : sponsors.length === 0 ? (
          <Text style={styles.emptyText}>Aucun sponsor affiché pour le moment.</Text>
        ) : (
          sponsors.map((sponsor) => (
            <TouchableOpacity 
              key={sponsor.id} 
              style={styles.sponsorCard}
              onPress={() => ouvrirSponsor(sponsor.website_url)}
              activeOpacity={sponsor.website_url ? 0.7 : 1}
              disabled={!sponsor.website_url}
            >
              {/* Encart Image format bannière / Carte de visite */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: sponsor.image_url }} style={styles.sponsorLogo} resizeMode="contain" />
              </View>

              {/* Bloc descriptif sous la carte/bannière */}
              <View style={styles.footerCardRow}>
                <View style={styles.sponsorTextContainer}>
                  <Text style={styles.sponsorNom}>{sponsor.name}</Text>
                  {sponsor.description ? (
                    <Text style={styles.sponsorDesc}>{sponsor.description}</Text>
                  ) : null}
                </View>
                
                {sponsor.website_url && (
                  <View style={styles.linkBadge}>
                    <Text style={styles.arrowIcon}>Visiter ➔</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
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
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginBottom: 16, opacity: 0.8 },
  
  sponsorCard: { 
    flexDirection: 'column', 
    backgroundColor: '#0F2241', 
    borderRadius: 14, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden'
  },
  
  // Augmenté à 150 de hauteur pour accueillir idéalement une carte de visite complète
  imageContainer: { 
    width: '100%', 
    height: 150, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  sponsorLogo: { width: '100%', height: '100%' },
  
  footerCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#0F2241'
  },
  sponsorTextContainer: { flex: 1, paddingRight: 10 },
  sponsorNom: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  sponsorDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, lineHeight: 16 }, // 👈 Corrigé : lineHeight
  
  linkBadge: {
    backgroundColor: 'rgba(197, 160, 89, 0.12)', 
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)'
  },
  arrowIcon: { color: '#C5A059', fontSize: 12, fontWeight: 'bold' },
  
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  loadingText: { color: '#FFFFFF', marginTop: 10, fontSize: 13 },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40, fontSize: 14 }
});

export default SponsorsScreen;