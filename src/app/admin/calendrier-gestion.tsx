import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../supabaseClient';

// Import conditionnel : DateTimePicker n'est pas utilisé sur le web
let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

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

// Composant input heure pour le web (input HTML natif)
const TimeInputWeb: React.FC<{ value: Date; onChange: (date: Date) => void }> = ({ value, onChange }) => {
  const heureStr = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;

  return (
    <input
      type="time"
      value={heureStr}
      onChange={(e) => {
        const [h, m] = e.target.value.split(':').map(Number);
        const newDate = new Date(value);
        newDate.setHours(h);
        newDate.setMinutes(m);
        onChange(newDate);
      }}
      style={{
        backgroundColor: '#0F2241',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        fontWeight: 'bold',
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  );
};

const CalendrierGestion: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idEvenement = params.id as string;
  const isEditing = !!idEvenement;

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [lieu, setLieu] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typeEvenement, setTypeEvenement] = useState<'match' | 'autre'>('autre');

  const [selectedDate, setSelectedDate] = useState('2026-06-05');
  const [showCalendar, setShowCalendar] = useState(false);

  const [selectedTime, setSelectedTime] = useState(new Date(2026, 5, 5, 15, 0));
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (isEditing) {
      if (params.titre) setTitre(params.titre as string);
      if (params.description) setDescription(params.description as string);
      if (params.lieu) setLieu(params.lieu as string);
      if (params.type) setTypeEvenement(params.type as 'match' | 'autre');

      if (params.date_evenement) {
        try {
          const d = new Date(params.date_evenement as string);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          setSelectedDate(`${yyyy}-${mm}-${dd}`);
          setSelectedTime(d);
        } catch (e) {
          console.log("Erreur de décodage de la date :", e);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEvenement]);

  const formatDateAffichage = (dateStr: string) => {
    const [annee, mois, jour] = dateStr.split('-');
    return `${jour}/${mois}/${annee}`;
  };

  const formatHeureAffichage = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h}h${m}`;
  };

  const onChangeTime = (event: any, date?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleSaveEvenement = async () => {
    if (!titre || !lieu) {
      Alert.alert("Champs manquants", "Veuillez remplir au moins le titre et le lieu.");
      return;
    }

    setIsSaving(true);

    try {
      const [annee, mois, jour] = selectedDate.split('-').map(Number);
      const timestampEvenement = new Date(
        annee,
        mois - 1,
        jour,
        selectedTime.getHours(),
        selectedTime.getMinutes()
      ).toISOString();

      const eventData = {
        titre: titre.trim(),
        description: description.trim(),
        date_evenement: timestampEvenement,
        lieu: lieu.trim(),
        type: typeEvenement
      };

      if (isEditing) {
        const { error } = await supabase
          .from('calendrier')
          .update(eventData)
          .eq('id', idEvenement);

        if (error) throw error;
        Alert.alert("Succès", "L'événement a bien été modifié !");
      } else {
        const { error } = await supabase
          .from('calendrier')
          .insert([eventData]);

        if (error) throw error;
        Alert.alert("Succès", "L'événement a bien été ajouté !");
      }

      const dateLisible = `${formatDateAffichage(selectedDate)} à ${formatHeureAffichage(selectedTime)}`;
      sendPushNotificationToAll(titre.trim(), dateLisible, isEditing);

      router.back();
    } catch (error: any) {
      Alert.alert("Erreur", "Action impossible : " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
            <Text style={styles.dateButtonText}>📅 {formatDateAffichage(selectedDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Heure du rendez-vous :</Text>
          {Platform.OS === 'web' ? (
            <TimeInputWeb value={selectedTime} onChange={setSelectedTime} />
          ) : (
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.dateButtonText}>🕐 {formatHeureAffichage(selectedTime)}</Text>
            </TouchableOpacity>
          )}

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

          <TouchableOpacity style={styles.submitButton} onPress={handleSaveEvenement} disabled={isSaving || isDeleting}>
            {isSaving ? <ActivityIndicator color="#0F2241" /> : <Text style={styles.submitButtonText}>{isEditing ? "ENREGISTRER LES MODIFICATIONS" : "PUBLIER L'ÉVÉNEMENT"}</Text>}
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvenement} disabled={isSaving || isDeleting}>
              {isDeleting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.deleteButtonText}>SUPPRIMER L'ÉVÉNEMENT</Text>}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Calendrier (date) */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => {
                setSelectedDate(day.dateString);
                setShowCalendar(false);
              }}
              markedDates={{
                [selectedDate]: { selected: true, selectedColor: '#C5A059' },
              }}
              theme={{
                backgroundColor: '#0F2241',
                calendarBackground: '#0F2241',
                textSectionTitleColor: '#C5A059',
                dayTextColor: '#FFFFFF',
                todayTextColor: '#C5A059',
                selectedDayBackgroundColor: '#C5A059',
                selectedDayTextColor: '#0F2241',
                monthTextColor: '#FFFFFF',
                arrowColor: '#C5A059',
                textDisabledColor: 'rgba(255,255,255,0.2)',
              }}
            />
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowCalendar(false)}>
              <Text style={styles.closeModalText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Picker natif d'heure (Android: dialog système) */}
      {showTimePicker && Platform.OS === 'android' && DateTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChangeTime}
        />
      )}

      {/* Picker natif d'heure (iOS: roue inline en modal) */}
      {showTimePicker && Platform.OS === 'ios' && DateTimePicker && (
        <Modal visible={showTimePicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={onChangeTime}
                textColor="#FFFFFF"
              />
              <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowTimePicker(false)}>
                <Text style={styles.closeModalText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  dateButton: { backgroundColor: '#0F2241', padding: 14, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  dateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#C5A059', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitButtonText: { color: '#0F2241', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  deleteButton: { backgroundColor: '#EF4444', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  deleteButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#0F2241', borderRadius: 12, padding: 10, width: '90%', maxWidth: 400 },
  closeModalButton: { marginTop: 10, padding: 12, alignItems: 'center' },
  closeModalText: { color: '#C5A059', fontWeight: 'bold' },
});

export default CalendrierGestion;