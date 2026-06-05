import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

const CalendrierGestion: React.FC = () => {
  const router = useRouter();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [lieu, setLieu] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // NOUVEAU : État pour différencier le type d'événement
  const [typeEvenement, setTypeEvenement] = useState<'match' | 'autre'>('autre');

  // SÉLECTEUR DE DATE MAISON
  const [selectedJourNum, setSelectedJourNum] = useState('05');
  const [selectedMoisNum, setSelectedMoisNum] = useState('06'); 
  const [selectedAnnee, setSelectedAnnee] = useState('2026');

  // SÉLECTEUR D'HEURE MAISON
  const [selectedHeure, setSelectedHeure] = useState('15');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const joursNumeros = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const moisNumeros = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const anneesListe = ['2026', '2027'];
  const heuresListe = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesListe = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const faireDefiler = (actuel: string, liste: string[], direction: number, setFonction: (val: string) => void) => {
    const indexActuel = liste.indexOf(actuel);
    let nouvelIndex = indexActuel + direction;
    if (nouvelIndex >= liste.length) nouvelIndex = 0;
    if (nouvelIndex < 0) nouvelIndex = liste.length - 1;
    setFonction(liste[nouvelIndex]);
  };

  const handleAddEvenement = async () => {
    if (!titre || !lieu) {
      Alert.alert("Champs manquants", "Veuillez remplir au moins le titre et le lieu.");
      return;
    }

    setIsSaving(true);

    try {
      const dateFormatee = `${selectedAnnee}-${selectedMoisNum}-${selectedJourNum}`;
      const heureFormatee = `${selectedHeure}:${selectedMinute}`;
      const timestampEvenement = new Date(`${dateFormatee}T${heureFormatee}:00`).toISOString();

      const { error } = await supabase
        .from('calendrier')
        .insert([
          {
            titre,
            description,
            date_evenement: timestampEvenement,
            lieu,
            type: typeEvenement // 👈 On envoie le type à Supabase ('match' ou 'autre')
          }
        ]);

      if (error) throw error;

      Alert.alert("Succès", "L'événement a bien été ajouté au calendrier !");
      router.back();
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible d'ajouter l'événement : " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un Événement</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        
        {/* NOUVEAU : SÉLECTEUR DE TYPE EN BOUTONS TOGGLE */}
        <Text style={styles.label}>Type d'événement :</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleButton, typeEvenement === 'match' && styles.toggleButtonMatchActive]} 
            onPress={() => setTypeEvenement('match')}
          >
            <Text style={[styles.toggleButtonText, typeEvenement === 'match' && styles.toggleButtonTextActive]}>⚽ MATCH / SPORTIF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, typeEvenement === 'autre' && styles.toggleButtonAutreActive]} 
            onPress={() => setTypeEvenement('autre')}
          >
            <Text style={[styles.toggleButtonText, typeEvenement === 'autre' && styles.toggleButtonTextActive]}>📆 AUTRE ÉVÉNEMENT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Titre de l'événement *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Réunion Comité, Tournoi U13..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={titre}
          onChangeText={setTitre}
        />

        {/* SÉLECTEUR DE DATE COMPACT */}
        <Text style={styles.label}>Date de l'événement :</Text>
        <View style={styles.selectorContainer}>
          <View style={styles.pickerColumn}>
            <TouchableOpacity onPress={() => faireDefiler(selectedJourNum, joursNumeros, -1, setSelectedJourNum)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
            <Text style={styles.pickerValue}>{selectedJourNum} j</Text>
            <TouchableOpacity onPress={() => faireDefiler(selectedJourNum, joursNumeros, 1, setSelectedJourNum)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
          </View>
          <View style={{ justifyContent: 'center' }}><Text style={styles.separatorSlash}>/</Text></View>
          <View style={styles.pickerColumn}>
            <TouchableOpacity onPress={() => faireDefiler(selectedMoisNum, moisNumeros, -1, setSelectedMoisNum)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
            <Text style={styles.pickerValue}>{selectedMoisNum} m</Text>
            <TouchableOpacity onPress={() => faireDefiler(selectedMoisNum, moisNumeros, 1, setSelectedMoisNum)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
          </View>
          <View style={{ justifyContent: 'center' }}><Text style={styles.separatorSlash}>/</Text></View>
          <View style={styles.pickerColumn}>
            <TouchableOpacity onPress={() => faireDefiler(selectedAnnee, anneesListe, -1, setSelectedAnnee)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
            <Text style={styles.pickerValue}>{selectedAnnee}</Text>
            <TouchableOpacity onPress={() => faireDefiler(selectedAnnee, anneesListe, 1, setSelectedAnnee)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
          </View>
        </View>

        {/* SÉLECTEUR D'HEURE */}
        <Text style={styles.label}>Heure du rendez-vous :</Text>
        <View style={[styles.selectorContainer, { maxWidth: 200 }]}>
          <View style={styles.pickerColumn}>
            <TouchableOpacity onPress={() => faireDefiler(selectedHeure, heuresListe, -1, setSelectedHeure)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
            <Text style={styles.pickerValue}>{selectedHeure} h</Text>
            <TouchableOpacity onPress={() => faireDefiler(selectedHeure, heuresListe, 1, setSelectedHeure)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
          </View>
          <View style={{ justifyContent: 'center', paddingHorizontal: 5 }}>
            <Text style={{ color: '#C5A059', fontWeight: 'bold', fontSize: 16 }}>:</Text>
          </View>
          <View style={styles.pickerColumn}>
            <TouchableOpacity onPress={() => faireDefiler(selectedMinute, minutesListe, -1, setSelectedMinute)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
            <Text style={styles.pickerValue}>{selectedMinute}</Text>
            <TouchableOpacity onPress={() => faireDefiler(selectedMinute, minutesListe, 1, setSelectedMinute)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Lieu *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Stade Municipal de Belleu"
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={lieu}
          onChangeText={setLieu}
        />

        <Text style={styles.label}>Description / Infos complémentaires</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Informations utiles pour les licenciés..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.submitButton} onPress={handleAddEvenement} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#0F2241" /> : <Text style={styles.submitButtonText}>PUBLIER L'ÉVÉNEMENT</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#0F2241', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backButton: { marginRight: 15 },
  backButtonText: { color: '#C5A059', fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20 },
  label: { color: '#C5A059', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#0F2241', color: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  // DESIGN DU BOUTON DE SÉLECTION DE TYPE
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  toggleButton: { flex: 1, height: 45, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  toggleButtonMatchActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' }, // Bleu Club pour les Matchs
  toggleButtonAutreActive: { backgroundColor: '#C5A059', borderColor: '#C5A059' }, // Or Club pour les autres événements
  toggleButtonText: { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: 12 },
  toggleButtonTextActive: { color: '#FFFFFF' },

  selectorContainer: { flexDirection: 'row', backgroundColor: '#0F2241', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 8, marginBottom: 5 },
  pickerColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arrowBtn: { paddingVertical: 2, width: '100%', alignItems: 'center' },
  arrowText: { color: '#C5A059', fontSize: 11 },
  pickerValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginVertical: 1 },
  separatorSlash: { color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 5 },
  submitButton: { backgroundColor: '#C5A059', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitButtonText: { color: '#0F2241', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});

export default CalendrierGestion;