import React, { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { FlatList, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

// Définition de la structure d'un joueur
interface Joueur {
  id: string;
  nom: string;
  prenom: string;
  categorie: string;
  poste: string;
  photo_url: string;
}

const CATEGORIES = ['Seniors', 'U18', 'U17', 'U15', 'U13', 'U11', 'U9', 'Dirigeants'];

export default function ListeJoueurs() {
  const { categorie } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Gestion dynamique de l'encoche mobile
  const [joueurs, setJoueurs] = useState<Joueur[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (categorie) {
        fetchJoueurs();
      }
    }, [categorie])
  );

  const fetchJoueurs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('joueurs')
      .select('*')
      .eq('categorie', categorie);
    
    if (error) {
      console.error("Erreur chargement joueurs:", error);
    } else {
      const ordrePostes: { [key: string]: number } = {
        'Entraineur': 1,
        'Gardien': 2,
        'Défenseur': 3,
        'Milieu': 4,
        'Attaquant': 5
      };

      const joueursTries = (data || []).sort((a, b) => {
        const poidsA = ordrePostes[a.poste] || 99;
        const poidsB = ordrePostes[b.poste] || 99;
        return poidsA - poidsB;
      });

      setJoueurs(joueursTries);
    }
    setLoading(false);
  };

  return (
    // Application dynamique du padding en haut pour éviter l'encoche mobile
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* Header personnalisé */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Effectif</Text>
      </View>

      {/* Conteneur pour la barre de navigation */}
      <View style={styles.tabWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContainer}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.tab, categorie === cat && styles.activeTab]} 
              onPress={() => router.replace(`/effectifs/${cat}` as any)}
            >
              <Text style={[styles.tabText, categorie === cat && styles.activeTabText]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des joueurs */}
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#C5A059" />
      ) : (
        <FlatList
          data={joueurs}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchJoueurs} tintColor="#C5A059" />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => router.push({
                pathname: '/admin/edition_joueur', 
                params: { id: item.id }
              })}
            >
              <Image source={{ uri: item.photo_url }} style={styles.photo} />
              <View style={styles.info}>
                <Text style={styles.prenom}>{item.prenom.toUpperCase()}</Text>
                <Text style={styles.nom}>{item.nom.toUpperCase()}</Text>
                <Text style={styles.poste}>{item.poste}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun joueur trouvé pour cette catégorie.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { color: '#C5A059', fontWeight: 'bold', marginRight: 15 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  tabWrapper: { width: '100%', overflow: 'visible', marginBottom: 10 },
  tabScroll: { flexGrow: 0, height: 50 },
  tabContainer: { paddingHorizontal: 20, paddingRight: 40 },
  tab: { 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    borderRadius: 20, 
    backgroundColor: '#0F2241', 
    marginRight: 12, 
    height: 35,
    justifyContent: 'center' 
  },
  activeTab: { backgroundColor: '#C5A059' },
  tabText: { color: '#FFF', fontSize: 14 },
  activeTabText: { fontWeight: 'bold', color: '#0F2241' },
  listPadding: { padding: 10 },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#0F2241',
    borderRadius: 16,
    alignItems: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  photo: { width: 140, height: 160, borderRadius: 8, marginBottom: 10, backgroundColor: '#0F2241' },
  info: { alignItems: 'center' },
  prenom: { color: '#FFF', fontSize: 12 },
  nom: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  poste: { color: '#C5A059', fontSize: 11, marginTop: 4 },
  emptyText: { color: '#FFF', textAlign: 'center', marginTop: 50 }
});