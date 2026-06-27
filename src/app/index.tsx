import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { version } from '../../package.json';
import { supabase } from '../supabaseClient';

// Importations
import AuthForm from '../components/AuthForm';
import NewsCard, { Article } from '../components/NewsCard';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { selectionnerEtEnvoyerPhoto } from '../services/photoService';

// @ts-ignore
import LogoClub from '../../assets/images/logo_club.png';

const Index: React.FC = () => {
  const router = useRouter();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [news, setNews] = useState<Article[]>([]);
  const [matchsDuJour, setMatchsDuJour] = useState<any[]>([]);

  usePushNotifications(isLoggedIn);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsLoggedIn(true);
      setIsInitialLoading(false);
    }).catch(() => setIsInitialLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    const channel = supabase
      .channel('matchs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matchs' }, () => {
        fetchDataFromCloud(false);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMatchsDuJour = async () => {
    const aujourdhui = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('matchs')
      .select('*')
      .gte('date', `${aujourdhui}T00:00:00`)
      .lte('date', `${aujourdhui}T23:59:59`)
      .order('date', { ascending: true });
    setMatchsDuJour(data || []);
  };

  const fetchDataFromCloud = async (showGlobalLoader = true) => {
    if (showGlobalLoader) setIsFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        const { data: licence } = await supabase
          .from('licencies_autorises')
          .select('est_admin')
          .eq('email', user.email.toLowerCase().trim())
          .maybeSingle();
        setIsAdmin(!!licence?.est_admin);
      }

      const { data: newsData } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(newsData || []);
      await fetchMatchsDuJour();
    } catch (error: any) { alert("Erreur : " + error.message); } 
    finally { setIsFetching(false); setIsRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { if (isLoggedIn) fetchDataFromCloud(false); }, [isLoggedIn]));

  const handleLogout = async () => { await supabase.auth.signOut(); setIsLoggedIn(false); };
  const handleSharePhoto = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setIsPhotoUploading(true);
    const publicUrl = await selectionnerEtEnvoyerPhoto(user.id);
    if (publicUrl) fetchDataFromCloud(false);
    setIsPhotoUploading(false);
  };

  if (isInitialLoading) return <View style={styles.container}><ActivityIndicator size="large" color="#C5A059" /></View>;
  if (!isLoggedIn) return <View style={styles.container}><AuthForm onLoginSuccess={() => setIsLoggedIn(true)} /><Text style={styles.versionText}>v{version}</Text></View>;

  // Fusion des données pour la liste
  const dataList = [...matchsDuJour.map(m => ({ ...m, isMatch: true })), ...news.map(n => ({ ...n, isMatch: false }))];

  return (
    <SafeAreaView style={styles.homeContainer} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.headerBar}>
        <Image source={LogoClub} style={styles.headerLogo} resizeMode="contain" />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>U.S. BELLEU</Text>
          <Text style={styles.headerSubtitle}>ESPACE MEMBRE</Text>
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.headerIconAction} onPress={() => router.push('/admin/messages')}>
            <Text style={{ fontSize: 16 }}>📥</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.headerIconAction} onPress={() => router.push('/notifications')}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIconAction} onPress={handleSharePhoto} disabled={isPhotoUploading}>
          {isPhotoUploading ? <ActivityIndicator color="#C5A059" size="small" /> : <Text style={{ fontSize: 18 }}>📸</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.miniLogout} onPress={handleLogout}><Text style={styles.miniLogoutText}>Quitter</Text></TouchableOpacity>
      </View>

      <FlatList 
        data={dataList} 
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          if (item.isMatch) {
            const dateMatch = new Date(item.date);
            const heureFormattee = dateMatch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const estEnDirect = new Date() >= dateMatch;
            return (
              <View style={styles.matchCardFull}>
                <Text style={styles.status}>{estEnDirect ? "🔴 EN DIRECT" : `À VENIR (${heureFormattee})`}</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.equipe}>{item.equipe_domicile}</Text>
                  <Text style={styles.score}>{item.score_domicile} - {item.score_exterieure}</Text>
                  <Text style={styles.equipe}>{item.equipe_exterieure}</Text>
                </View>
                {item.buteurs_belleu && (
                  <View style={styles.buteursContainer}>
                    <Text style={styles.buteursTextInline}>
                      <Text style={{ fontWeight: 'bold' }}>⚽ Buteurs : </Text>
                      {item.buteurs_belleu}
                    </Text>
                  </View>
                )}
              </View>
            );
          }
          return <NewsCard item={item} />;
        }}
        contentContainerStyle={styles.scrollList}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => fetchDataFromCloud(false)} tintColor="#C5A059" />}
      />

      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/resultats/resultats')}><Text style={styles.tabBarIcon}>⚽</Text><Text style={styles.tabBarLabel}>Résultats</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/calendrier')}><Text style={styles.tabBarIcon}>📆</Text><Text style={styles.tabBarLabel}>Calendrier</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/galerie')}><Text style={styles.tabBarIcon}>🖼️</Text><Text style={styles.tabBarLabel}>Galerie</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/effectifs/Seniors' as any)}><Text style={styles.tabBarIcon}>🏃‍♂️</Text><Text style={styles.tabBarLabel}>Effectifs</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/sponsors')}><Text style={styles.tabBarIcon}>🤝</Text><Text style={styles.tabBarLabel}>Sponsors</Text></TouchableOpacity>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/contact')}><Text style={styles.tabBarIcon}>📞</Text><Text style={styles.tabBarLabel}>Contact</Text></TouchableOpacity>
        {isAdmin && (<TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/admin')}><Text style={styles.tabBarIcon}>👑</Text><Text style={styles.tabBarLabel}>Admin</Text></TouchableOpacity>)}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2241' },
  homeContainer: { flex: 1, backgroundColor: '#0F2241' },
  headerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F2241', paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  headerLogo: { width: 45, height: 45 },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#C5A059', fontSize: 11, fontWeight: 'bold' },
  headerIconAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  miniLogout: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  miniLogoutText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  scrollList: { padding: 15, maxWidth: 450, width: '100%', alignSelf: 'center', backgroundColor: '#061329' },
  matchCardFull: { backgroundColor: '#0F2241', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#C5A059' },
  status: { color: '#FFF', fontSize: 9, textAlign: 'center', opacity: 0.7, marginBottom: 5 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  score: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  equipe: { color: '#FFF', fontSize: 14, flex: 1, textAlign: 'center', fontWeight: '600' },
  buteursContainer: { marginTop: 8, alignItems: 'center' },
  buteursTextInline: { color: '#C5A059', fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  bottomTabBar: { flexDirection: 'row', backgroundColor: '#0F2241', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingBottom: 25, justifyContent: 'space-around' },
  tabBarItem: { alignItems: 'center', flex: 1 },
  tabBarIcon: { fontSize: 20, marginBottom: 3 },
  tabBarLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '500', opacity: 0.8 },
  versionText: { position: 'absolute', bottom: 10, right: 15, color: 'rgba(255,255,255,0.3)', fontSize: 12 },
});

export default Index;