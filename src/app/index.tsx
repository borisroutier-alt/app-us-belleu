import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';

// Importations
import AuthForm from '../components/AuthForm';
import MatchCard, { Match } from '../components/MatchCard';
import NewsCard, { Article } from '../components/NewsCard';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { selectionnerEtEnvoyerPhoto } from '../services/photoService';

// @ts-ignore
import LogoClub from '../../assets/images/logo_club.png';

const Index: React.FC = () => {
  const router = useRouter();
  
  // États de l'application
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'actus' | 'matchs'>('actus');
  const [responses, setResponses] = useState<Record<string, 'present' | 'absent'>>({});
  const [news, setNews] = useState<Article[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  usePushNotifications(isLoggedIn);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setIsLoggedIn(true);
      setIsInitialLoading(false);
    }).catch(() => setIsInitialLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDataFromCloud = async () => {
    setIsFetching(true);
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

      const { data: newsData, error: newsError } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      if (newsError) throw newsError;
      setNews(newsData || []);

      const { data: matchesData, error: matchesError } = await supabase.from('matches').select('*').order('date', { ascending: true });
      if (matchesError) throw matchesError;
      setMatches(matchesData || []);
    } catch (error: any) {
      alert("Erreur de chargement Cloud : " + error.message);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchDataFromCloud();
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setIsAdmin(false);
      setActiveTab('actus');
      setResponses({});
    } catch (error: any) {
      alert("Erreur lors de la déconnexion : " + error.message);
    }
  };

  const handleSelectStatus = (matchId: string, status: 'present' | 'absent') => {
    setResponses(prev => ({ ...prev, [matchId]: status }));
  };

  const handleSharePhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Vous devez être connecté pour partager une photo.");
      
      setIsPhotoUploading(true);
      const publicUrl = await selectionnerEtEnvoyerPhoto(user.id);
      if (publicUrl && activeTab === 'actus') fetchDataFromCloud();
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#C5A059" />
        <Text style={{ color: '#FFFFFF', marginTop: 15, fontWeight: '600' }}>
          Vérification des accès U.S. Belleu...
        </Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return <AuthForm onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <SafeAreaView style={styles.homeContainer} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      {/* BARRE D'EN-TÊTE CHIC */}
      <View style={styles.headerBar}>
        <Image source={LogoClub} style={styles.headerLogo} resizeMode="contain" />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>U.S. BELLEU</Text>
          <Text style={styles.headerSubtitle}>ESPACE MEMBRE</Text>
        </View>
        
        {/* Bouton Appareil Photo intégré discrètement dans le header */}
        <TouchableOpacity 
          style={[styles.headerIconAction, isPhotoUploading && { backgroundColor: 'transparent' }]} 
          onPress={handleSharePhoto}
          disabled={isPhotoUploading}
        >
          {isPhotoUploading ? (
            <ActivityIndicator color="#C5A059" size="small" />
          ) : (
            <Text style={{ fontSize: 18 }}>📸</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.miniLogout} onPress={handleLogout}>
          <Text style={styles.miniLogoutText}>Quitter</Text>
        </TouchableOpacity>
      </View>

      {/* SOUS-ONGLETS PRINCIPAUX (ACTUS / MATCHS) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'actus' && styles.activeTabButton]} onPress={() => setActiveTab('actus')}>
          <Text style={[styles.tabButtonText, activeTab === 'actus' && styles.activeTabButtonText]}>📢 ACTUALITÉS</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'matchs' && styles.activeTabButton]} onPress={() => setActiveTab('matchs')}>
          <Text style={[styles.tabButtonText, activeTab === 'matchs' && styles.activeTabButtonText]}>📅 MATCHS</Text>
        </TouchableOpacity>
      </View>

      {/* CORPS PRINCIPAL DÉGAGÉ ET PROPRE */}
      <View style={{ flex: 1, backgroundColor: '#061329' }}>
        {isFetching ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#C5A059" />
            <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Connexion au Cloud...</Text>
          </View>
        ) : activeTab === 'actus' ? (
          <FlatList 
            data={news} 
            keyExtractor={(item) => item.id} 
            renderItem={({ item }) => <NewsCard item={item} />} 
            contentContainerStyle={styles.scrollList} 
            showsVerticalScrollIndicator={false} 
          />
        ) : (
          <FlatList 
            data={matches} 
            keyExtractor={(item) => item.id} 
            renderItem={({ item }) => (
              <MatchCard item={item} userChoice={responses[item.id]} onSelectStatus={handleSelectStatus} />
            )} 
            contentContainerStyle={styles.scrollList} 
            showsVerticalScrollIndicator={false} 
          />
        )}
      </View>

      {/* BARRE DE NAVIGATION MODERNE TOUT EN BAS */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/classement')}>
          <Text style={styles.tabBarIcon}>🏆</Text>
          <Text style={styles.tabBarLabel}>Classement</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/galerie')}>
          <Text style={styles.tabBarIcon}>🖼️</Text>
          <Text style={styles.tabBarLabel}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/contact')}>
          <Text style={styles.tabBarIcon}>📞</Text>
          <Text style={styles.tabBarLabel}>Contact</Text>
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/admin/messages')}>
            <Text style={styles.tabBarIcon}>📥</Text>
            <Text style={styles.tabBarLabel}>Secrétariat</Text>
          </TouchableOpacity>
        )}
        
        {isAdmin && (
          <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/admin')}>
            <Text style={styles.tabBarIcon}>👑</Text>
            <Text style={styles.tabBarLabel}>Configuration</Text>
          </TouchableOpacity>
        )}
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#14294E' },
  homeContainer: { flex: 1, backgroundColor: '#0F2241' },
  headerBar: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  backgroundColor: '#0F2241', 
  paddingVertical: 15, 
  paddingHorizontal: 20, 
  borderBottomWidth: 1, 
  borderColor: 'rgba(255,255,255,0.1)' 
},
  headerLogo: { width: 45, height: 45 },
  headerTitleContainer: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#C5A059', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  headerIconAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  miniLogout: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  miniLogoutText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#0F2241', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  activeTabButton: { borderBottomWidth: 3, borderColor: '#C5A059' },
  tabButtonText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 'bold' },
  activeTabButtonText: { color: '#C5A059' },
  scrollList: { padding: 15, maxWidth: 450, width: '100%', alignSelf: 'center', backgroundColor: '#061329' },
  
  // NOUVEAUX STYLES DE LA BARRE INFÉRIEURE 
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F2241',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingBottom: 25, // Un peu plus d'espace en bas pour les barres d'onglets iPhone récents
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  tabBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  tabBarIcon: {
    fontSize: 20,
    marginBottom: 3
  },
  tabBarLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8
  }
});

export default Index;