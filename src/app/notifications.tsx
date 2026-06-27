import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native-gesture-handler'; // Optionnel, si vous utilisez react-native-gesture-handler
import { useRouter } from 'expo-router';
import { supabase } from '../supabaseClient';

const CATEGORIES = ["Seniors A", "Seniors B", "Seniors C", "U17", "U15", "U14", "U13"];

export default function NotificationsPage() {
  const router = useRouter();
  const [abos, setAbos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAbonnements();
  }, []);

  const fetchAbonnements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('abonnements').select('categorie').eq('user_id', user.id);
    setAbos(data?.map(a => a.categorie) || []);
    setLoading(false);
  };

  const toggleAbo = async (cat: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return;

    if (abos.includes(cat)) {
      await supabase.from('abonnements').delete().eq('user_id', user.id).eq('categorie', cat);
      setAbos(abos.filter(c => c !== cat));
    } else {
      await supabase.from('abonnements').insert({ 
        user_id: user.id, 
        email: user.email, 
        categorie: cat 
      });
      setAbos([...abos, cat]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#C5A059" style={{marginTop: 50}} />
      ) : (
        <FlatList 
          data={CATEGORIES} 
          keyExtractor={(item) => item} 
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.catText}>{item}</Text>
              <Switch
                trackColor={{ false: "#374151", true: "#10B981" }}
                thumbColor={abos.includes(item) ? "#FFF" : "#f4f3f4"}
                onValueChange={() => toggleAbo(item)}
                value={abos.includes(item)}
              />
            </View>
        )} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backText: { color: '#C5A059', fontWeight: 'bold', marginRight: 15 },
  title: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  listContainer: { paddingHorizontal: 20 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderColor: '#0F2241' 
  },
  catText: { color: '#FFF', fontSize: 17 },
});