import { useLocalSearchParams, useRouter } from 'expo-router'; // 👈 Vérifie bien l'import de useLocalSearchParams
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

// Fonction d'envoi des notifications push via Expo
const sendPushNotificationToAll = async (eventTitle: string, eventDate: string, isModification = false) => {
  try {
    const { data: licencies, error } = await supabase
      .from('licencies_autorises')
      .select('expo_push_token')
      .not('expo_push_token', 'is', null);

    if (error) throw error;
    if (!licencies || licencies.length === 0) return;

    const tokens = Array.from(new Set(licencies.map(l => l.expo_push_token).filter(Boolean)));
    if (tokens.length === 0) return;

    const actionText = isModification ? "🔧 Événement modifié" : "📅 Nouveau sur le calendrier";

    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: `${actionText} - U.S. BELLEU`,
      body: `L'événement "${eventTitle}" est programmé le ${eventDate}.`,
      badge: 1,
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("Erreur notification push :", err);
  }
};

const CalendrierGestion: React.FC = () => {
  const router = useRouter();
  
  // 🚀 RÉCUPÉRATION DES PARAMÈTRES ENVOYÉS PAR LE BOUTON
  const params = useLocalSearchParams();
  const idEvenement = params.id as string; 
  const isEditing = !!idEvenement; // Devient 'true' si un ID existe, donc mode édition

  // ÉTATS DES CHAMPS
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [lieu, setLieu] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeEvenement, setTypeEvenement] = useState<'match' | 'autre'>('autre');

  // ÉTATS DES SÉLECTEURS DE DATE & HEURE
  const [selectedJourNum, setSelectedJourNum] = useState('05');
  const [selectedMoisNum, setSelectedMoisNum] = useState('06'); 
  const [selectedAnnee, setSelectedAnnee] = useState('2026');
  const [selectedHeure, setSelectedHeure] = useState('15');
  const [selectedMinute, setSelectedMinute] = useState('00');

  const joursNumeros = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const moisNumeros = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const anneesListe = ['2026', '2027'];
  const heuresListe = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesListe = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // 🚀 EFFET INDISPONSABLE : Remplit les champs dès que les paramètres "params" arrivent
  useEffect(() => {
    if (isEditing) {
      if (params.titre) setTitre(params.titre as string);
      if (params.description) setDescription(params.description as string);
      if (params.lieu) setLieu(params.lieu as string);
      if (params.type) setTypeEvenement(params.type as 'match' | 'autre');
      
      if (params.date_evenement) {
        try {
          // Exemple de date reçue de Supabase : "2026-06-05T15:00:00.000Z"
          const d = new Date(params.date_evenement as string);
          setSelectedAnnee(String(d.getFullYear()));
          setSelectedMoisNum(String(d.getMonth() + 1).padStart(2, '0'));
          setSelectedJourNum(String(d.getDate()).padStart(2, '0'));
          setSelectedHeure(String(d.getHours()).padStart(2, '0'));
          
          const min = d.getMinutes();
          const minFormatee = String(Math.round(min / 5) * 5).padStart(2, '0');
          if (minutesListe.includes(minFormatee)) {
            setSelectedMinute(minFormatee);
          }
        } catch (e) {
          console.log("Erreur de décodage de la date :", e);
        }
      }
    }
  }, [idEvenement, params]); // Se redéclenche si l'ID ou les paramètres changent

  const faireDefiler = (actuel: string, liste: string[], direction: number, setFonction: (val: string) => void) => {
    const indexActuel = liste.indexOf(actuel);
    let nouvelIndex = indexActuel + direction;
    if (nouvelIndex >= liste.length) nouvelIndex = 0;
    if (nouvelIndex < 0) nouvelIndex = liste.length - 1;
    setFonction(liste[nouvelIndex]);
  };

  // Enregistrer (Mise à jour si isEditing, sinon Insertion)
  const handleSaveEvenement = async () => {
    if (!titre || !lieu) {
      Alert.alert("Champs manquants", "Veuillez remplir au moins le titre et le lieu.");
      return;
    }

    setIsSaving(true);

    try {
      const dateFormatee = `${selectedAnnee}-${selectedMoisNum}-${selectedJourNum}`;
      const heureFormatee = `${selectedHeure}:${selectedMinute}`;
      const timestampEvenement = new Date(`${dateFormatee}T${heureFormatee}:00`).toISOString();

      const eventData = {
        titre: titre.trim(),
        description: description.trim(),
        date_evenement: timestampEvenement,
        lieu: lieu.trim(),
        type: typeEvenement
      };

      if (isEditing) {
        // 🔧 MODE MODIFICATION
        const { error } = await supabase
          .from('calendrier')
          .update(eventData)
          .eq('id', idEvenement);

        if (error) throw error;
        Alert.alert("Succès", "L'événement a bien été modifié !");
      } else {
        // 📅 MODE AJOUT
        const { error } = await supabase
          .from('calendrier')
          .insert([eventData]);

        if (error) throw error;
        Alert.alert("Succès", "L'événement a bien été ajouté !");
      }

      const dateLisible = `${selectedJourNum}/${selectedMoisNum}/${selectedAnnee} à ${selectedHeure}h${selectedMinute}`;
      sendPushNotificationToAll(titre.trim(), dateLisible, isEditing);

      router.back();
    } catch (error: any) {
      Alert.alert("Erreur", "Action impossible : " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction de Suppression
  const handleDeleteEvenement = () => {
    Alert.alert(
      "Supprimer l'événement",
      "Es-tu sûr de vouloir supprimer définitivement cet événement du calendrier ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('calendrier')
                .delete()
                .eq('id', idEvenement);

              if (error) throw error;
              Alert.alert("Supprimé", "L'événement a été retiré.");
              router.back();
            } catch (error: any) {
              Alert.alert("Erreur", "Impossible de supprimer : " + error.message);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>⬅ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? "Modifier l'Événement" : "Ajouter un Événement"}</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          
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

          {/* Le bouton principal s'adapte dynamiquement */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSaveEvenement} disabled={isSaving || isDeleting}>
            {isSaving ? <ActivityIndicator color="#0F2241" /> : <Text style={styles.submitButtonText}>{isEditing ? "ENREGISTRER LES MODIFICATIONS" : "PUBLIER L'ÉVÉNEMENT"}</Text>}
          </TouchableOpacity>

          {/* Le bouton rouge de suppression s'affiche uniquement si isEditing est vrai */}
          {isEditing && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvenement} disabled={isSaving || isDeleting}>
              {isDeleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.deleteButtonText}>SUPPRIMER L'ÉVÉNEMENT</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#0F2241', borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  backButton: { marginRight: 15 },
  backButtonText: { color: '#C5A059', fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20, paddingBottom: 40 },
  label: { color: '#C5A059', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#0F2241', color: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  toggleButton: { flex: 1, height: 45, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  toggleButtonMatchActive: { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' },
  toggleButtonAutreActive: { backgroundColor: '#C5A059', borderColor: '#C5A059' },
  toggleButtonText: { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: 12 },
  toggleButtonTextActive: { color: '#FFFFFF' },
  selectorContainer: { flexDirection: 'row', backgroundColor: '#0F2241', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 8, marginBottom: 5 },
  pickerColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  arrowBtn: { paddingVertical: 2, width: '100%', alignItems: 'center' },
  arrowText: { color: '#C5A059', fontSize: 11 },
  pickerValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginVertical: 1 },
  separatorSlash: { color: 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 'bold', paddingHorizontal: 5 },
  submitButton: { backgroundColor: '#C5A059', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitButtonText: { color: '#0F2241', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  deleteButton: { backgroundColor: '#EF4444', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  deleteButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});

export default CalendrierGestion;