import { Slot, useRouter, useSegments } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EquipesLayout() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  const activeTab = segments[segments.length - 1];

  // Configuration des deux onglets uniquement
  const tabs = [
    { id: 'resultats', label: 'RESULTATS' },
    { id: 'classement', label: 'CLASSEMENT' }
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#1E293B' }}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>⬅ ACCUEIL</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
      </View>

      <View style={styles.topTabs}>
        {tabs.map((tab) => (
          <TouchableOpacity 
            key={tab.id} 
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => router.replace(`/resultats/${tab.id}` as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F2241', paddingHorizontal: 15, paddingBottom: 10 },
  backButton: { padding: 10 },
  backButtonText: { color: '#C5A059', fontWeight: 'bold', fontSize: 12 },
  headerTitle: { color: '#FFF', fontWeight: 'bold', marginLeft: 10 },
  topTabs: { flexDirection: 'row', backgroundColor: '#0F2241' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#C5A059' },
  tabText: { color: '#888', fontWeight: 'bold' },
  activeTabText: { color: '#C5A059' }
});