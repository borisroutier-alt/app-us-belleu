import { useState } from 'react';
import {
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
    ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

export default function GestionLicencies() {
  const [bulkData, setBulkData] = useState('');
  const [loadingWhiteList, setLoadingWhiteList] = useState(false);
  const [manualNom, setManualNom] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [loadingSingle, setLoadingSingle] = useState(false);

  // LOGIQUE IMPORT EN BLOC
  const handleImportBulkLicencies = async () => {
    if (!bulkData.trim()) return Alert.alert("Erreur", "Veuillez coller des données.");
    setLoadingWhiteList(true);
    try {
      const lines = bulkData.split('\n');
      const rows = lines.map(line => {
        const [email, nom] = line.split(';');
        return { email: email.trim(), nom_prenom: (nom || 'Inconnu').trim(), est_admin: false };
      });
      const { error } = await supabase.from('licencies_autorises').insert(rows);
      if (error) throw error;
      Alert.alert("Succès", "Importation réussie");
      setBulkData('');
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setLoadingWhiteList(false); }
  };

  // LOGIQUE AJOUT MANUEL
  const handleImportSingleLicencie = async () => {
    if (!manualNom.trim()) return Alert.alert("Erreur", "Le nom et le prénom sont requis.");
    setLoadingSingle(true);
    try {
      const { error } = await supabase.from('licencies_autorises').insert([
        { email: manualEmail.trim().toLowerCase(), nom_prenom: manualNom.trim(), est_admin: false }
      ]);
      if (error) throw error;
      Alert.alert("Succès", "Licencié ajouté avec succès");
      setManualNom(''); setManualEmail('');
    } catch (e: any) { Alert.alert("Erreur", e.message); } finally { setLoadingSingle(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>Gestion des Licenciés</Text>

          {/* SECTION IMPORT BLOC */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Option A : Import en bloc</Text>
            <TextInput 
              style={styles.textArea} 
              placeholder="Email;Nom Prénom" 
              placeholderTextColor="#888"
              value={bulkData} 
              onChangeText={setBulkData} 
              multiline 
            />
            <TouchableOpacity style={styles.btn} onPress={handleImportBulkLicencies}>
              {loadingWhiteList ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>VALIDER L'IMPORT BLOC</Text>}
            </TouchableOpacity>
          </View>

          {/* SECTION AJOUT MANUEL */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Option B : Ajout manuel</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Nom et Prenom" 
              placeholderTextColor="#555" 
              value={manualNom} 
              onChangeText={setManualNom} 
            />
            
            <TextInput 
              style={styles.input} 
              placeholder="Adresse email" 
              placeholderTextColor="#555" 
              value={manualEmail} 
              onChangeText={setManualEmail} 
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#10B981' }]} onPress={handleImportSingleLicencie}>
              {loadingSingle ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>AJOUTER CE LICENCIÉ</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B' },
  content: { padding: 15 },
  header: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#0F2241', borderRadius: 16, padding: 15, marginBottom: 15 },
  sectionTitle: { color: '#C5A059', fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#FFF', padding: 10, borderRadius: 5, marginBottom: 10, color: '#000' },
  textArea: { backgroundColor: '#FFF', padding: 10, borderRadius: 5, height: 100, marginBottom: 10, color: '#000', textAlignVertical: 'top' },
  btn: { backgroundColor: '#C5A059', padding: 15, alignItems: 'center', borderRadius: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});