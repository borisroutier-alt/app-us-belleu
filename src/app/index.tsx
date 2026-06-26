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
import { version } from '../../package.json'; // Import de la version
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

      const { data: newsData, error: newsError } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (newsError) throw newsError;
      setNews(newsData || []);

    } catch (error: any) {
      alert("Erreur de chargement Cloud : " + error.message);
    } finally {
      setIsFetching(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchDataFromCloud(false);
      }
    }, [isLoggedIn])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDataFromCloud(false); 
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setIsAdmin(false);
    } catch (error: any) {
      alert("Erreur lors de la déconnexion : " + error.message);
    }
  };

  const handleSharePhoto = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert("Vous devez être connecté pour partager une photo.");
      
      setIsPhotoUploading(true);
      const publicUrl = await selectionnerEtEnvoyerPhoto(user.id);
      if (publicUrl) fetchDataFromCloud(false);
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
    return (
      <View style={styles.container}>
        <AuthForm onLoginSuccess={() => setIsLoggedIn(true)} />
        {/* Version affichée discrètement en bas à droite */}
        <Text style={styles.versionText}>v{version}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.homeContainer} edges={['top']}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.headerBar}>
  <Image source={LogoClub} style={styles.headerLogo} resizeMode="contain" />
  
  <View style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>U.S. BELLEU</Text>
    <Text style={styles.headerSubtitle}>ESPACE MEMBRE</Text>
  </View>

  {/* NOUVEAU BOUTON MESSAGERIE (Admin uniquement) */}
  {isAdmin && (
    <TouchableOpacity 
      style={styles.headerIconAction} 
      onPress={() => router.push('/admin/messages')}
    >
      <Text style={{ fontSize: 16 }}>📥</Text>
    </TouchableOpacity>
  )}
  
  {/* Bouton photo existant */}
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

  {/* Bouton Quitter */}
  <TouchableOpacity style={styles.miniLogout} onPress={handleLogout}>
    <Text style={styles.miniLogoutText}>Quitter</Text>
  </TouchableOpacity>
</View>

      <View style={{ flex: 1, backgroundColor: '#061329' }}>
        {isFetching ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#C5A059" />
            <Text style={{ color: '#FFFFFF', marginTop: 10 }}>Connexion au Cloud...</Text>
          </View>
        ) : (
          <FlatList 
            data={news} 
            keyExtractor={(item) => item.id} 
            renderItem={({ item }) => <NewsCard item={item} />} 
            contentContainerStyle={styles.scrollList} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={onRefresh} 
                tintColor="#C5A059"
                colors={["#C5A059"]}
              />
            }
          />
        )}
      </View>

      <View style={styles.bottomTabBar} key={isAdmin ? 'bar-admin' : 'bar-user'}>
        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/resultats/resultats')}>
  <Text style={styles.tabBarIcon}>⚽</Text>
  <Text style={styles.tabBarLabel}>Résultats</Text>
</TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/calendrier')}>
          <Text style={styles.tabBarIcon}>📆</Text>
          <Text style={styles.tabBarLabel}>Calendrier</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/galerie')}>
          <Text style={styles.tabBarIcon}>🖼️</Text>
          <Text style={styles.tabBarLabel}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/sponsors')}>
          <Text style={styles.tabBarIcon}>🤝</Text>
          <Text style={styles.tabBarLabel}>Sponsors</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/contact')}>
          <Text style={styles.tabBarIcon}>📞</Text>
          <Text style={styles.tabBarLabel}>Contact</Text>
        </TouchableOpacity>
      
        {isAdmin && (
          <TouchableOpacity style={styles.tabBarItem} onPress={() => router.push('/admin')}>
            <Text style={styles.tabBarIcon}>👑</Text>
            <Text style={styles.tabBarLabel}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2241' },
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
  scrollList: { padding: 15, maxWidth: 450, width: '100%', alignSelf: 'center', backgroundColor: '#061329' },
  
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0F2241',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingBottom: 25, 
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
  },
  versionText: {
    position: 'absolute',
    bottom: 10,
    right: 15,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12
  }
});

export default Index;