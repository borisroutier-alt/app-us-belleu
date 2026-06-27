import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../../supabaseClient';
import { sendPushNotification } from '../../services/notificationService';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ManageLiveMatchs() {
  const router = useRouter();
  const [matchs, setMatchs] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [buteurModalVisible, setButeurModalVisible] = useState(false);
  
  // États formulaire
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dom, setDom] = useState('');
  const [ext, setExt] = useState('');
  const [categorie, setCategorie] = useState('Seniors A');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const categoriesDisponibles = ["Seniors A", "Seniors B", "Seniors C", "U17", "U15", "U14", "U13"];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // États pour buteurs
  const [buteurEnCours, setButeurEnCours] = useState('');
  const [matchCible, setMatchCible] = useState<any>(null);
  const [fieldCible, setFieldCible] = useState<'score_domicile' | 'score_exterieure'>('score_domicile');

  useEffect(() => { fetchMatchs(); }, []);

  const fetchMatchs = async () => {
    const { data } = await supabase.from('matchs').select('*').order('date', { ascending: true });
    setMatchs(data || []);
  };

  const handleSaveMatch = async () => {
    if (!dom || !ext || !categorie) return Alert.alert("Erreur", "Tous les champs sont obligatoires");
    const [annee, mois, jour] = selectedDate.split('-').map(Number);
    const finalDate = new Date(annee, mois - 1, jour, selectedTime.getHours(), selectedTime.getMinutes());

    const matchData = { equipe_domicile: dom, equipe_exterieure: ext, date: finalDate.toISOString(), categorie };

    if (editingId) {
      await supabase.from('matchs').update(matchData).eq('id', editingId);
    } else {
      await supabase.from('matchs').insert([{ ...matchData, score_domicile: 0, score_exterieure: 0, buteurs_belleu: '' }]);
    }
    setEditingId(null); setDom(''); setExt(''); setModalVisible(false);
    fetchMatchs();
  };

  const deleteMatch = (id: number) => {
    Alert.alert("Suppression", "Supprimer ce match ?", [
      { text: "Annuler" }, 
      { text: "Supprimer", style: 'destructive', onPress: async () => { await supabase.from('matchs').delete().eq('id', id); fetchMatchs(); }}
    ]);
  };

  const preparerAjoutBut = (item: any, field: 'score_domicile' | 'score_exterieure') => {
    setMatchCible(item);
    setFieldCible(field);
    setButeurEnCours('');
    setButeurModalVisible(true);
  };

  const validerBut = async () => {
    const newScore = matchCible[fieldCible] + 1;
    let updateData: any = { [fieldCible]: newScore };

    if (buteurEnCours.trim() !== '') {
      updateData.buteurs_belleu = matchCible.buteurs_belleu ? `${matchCible.buteurs_belleu}, ${buteurEnCours.trim()}` : buteurEnCours.trim();
    }

    const { error } = await supabase.from('matchs').update(updateData).eq('id', matchCible.id);
    
    if (!error) {
      const { data: abos } = await supabase.from('abonnements').select('email').eq('categorie', matchCible.categorie);
      if (abos?.length) {
        const emails = abos.map(a => a.email).filter(Boolean);
        const { data: tokensData } = await supabase.from('licencies_autorises').select('expo_push_token').in('email', emails);
        const tokens = tokensData?.map(t => t.expo_push_token).filter((t): t is string => t !== null) || [];
        if (tokens.length > 0) {
          await sendPushNotification(tokens, "🔴 Match en direct - US Belleu", `${matchCible.equipe_domicile} ${fieldCible === 'score_domicile' ? newScore : matchCible.score_domicile} - ${fieldCible === 'score_exterieure' ? newScore : matchCible.score_exterieure} ${matchCible.equipe_exterieure}${buteurEnCours ? ` (Buteur: ${buteurEnCours})` : ''}`);
        }
      }
    }
    setButeurModalVisible(false);
    fetchMatchs();
  };

  const annulerDernierBut = async (item: any, field: 'score_domicile' | 'score_exterieure') => {
    const newScore = Math.max(0, item[field] - 1);
    if (newScore === item[field]) return;
    let nouveauxButeurs = item.buteurs_belleu || '';
    let buteurSupprime = "";
    if (nouveauxButeurs.includes(',')) {
      const tableauButeurs = nouveauxButeurs.split(',').map((b: string) => b.trim());
      buteurSupprime = tableauButeurs.pop() || "";
      nouveauxButeurs = tableauButeurs.join(', ');
    } else {
      buteurSupprime = nouveauxButeurs;
      nouveauxButeurs = '';
    }
    
    const { error } = await supabase.from('matchs').update({ [field]: newScore, buteurs_belleu: nouveauxButeurs }).eq('id', item.id);
    
    if (!error) {
      const { data: abos } = await supabase.from('abonnements').select('email').eq('categorie', item.categorie);
      if (abos?.length) {
        const emails = abos.map(a => a.email).filter(Boolean);
        const { data: tokensData } = await supabase.from('licencies_autorises').select('expo_push_token').in('email', emails);
        const tokens = tokensData?.map(t => t.expo_push_token).filter((t): t is string => t !== null) || [];
        if (tokens.length > 0) {
          await sendPushNotification(tokens, "⚠️ Rectification - Match US Belleu", `Score mis à jour : ${field === 'score_domicile' ? newScore : item.score_domicile} - ${field === 'score_exterieure' ? newScore : item.score_exterieure}${buteurSupprime ? `. (But de ${buteurSupprime} annulé)` : ""}`);
        }
      }
    }
    fetchMatchs();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backText}>⬅ Retour</Text></TouchableOpacity>
        <Text style={styles.title}>Gestion Live</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingId(null); setDom(''); setExt(''); setModalVisible(true); }}><Text style={styles.btnText}>➕ Nouveau</Text></TouchableOpacity>
      </View>
      
      <FlatList data={matchs} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.matchDate}>{item.categorie} - {new Date(item.date).toLocaleString('fr-FR', { hour: '2-digit', minute:'2-digit' })}</Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => { setEditingId(item.id); setDom(item.equipe_domicile); setExt(item.equipe_exterieure); setCategorie(item.categorie); setModalVisible(true); }}><Text style={{fontSize: 18}}>✏️</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteMatch(item.id)} style={{marginLeft: 15}}><Text style={{fontSize: 18}}>🗑️</Text></TouchableOpacity>
            </View>
          </View>
          <Text style={styles.matchTitle}>{item.equipe_domicile} vs {item.equipe_exterieure}</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{item.score_domicile}</Text>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.btnMinus} onPress={() => annulerDernierBut(item, 'score_domicile')}><Text style={styles.btnText}>-1</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnPlus} onPress={() => preparerAjoutBut(item, 'score_domicile')}><Text style={styles.btnText}>+1</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.score}>{item.score_exterieure}</Text>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.btnMinus} onPress={() => annulerDernierBut(item, 'score_exterieure')}><Text style={styles.btnText}>-1</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnPlus} onPress={() => preparerAjoutBut(item, 'score_exterieure')}><Text style={styles.btnText}>+1</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}/>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>{editingId ? "Modifier" : "Nouveau Match"}</Text>
            <TextInput placeholder="Équipe recevante" placeholderTextColor="#888" value={dom} onChangeText={setDom} style={styles.input} />
            <TextInput placeholder="Équipe se déplaçant" placeholderTextColor="#888" value={ext} onChangeText={setExt} style={styles.input} />
            <TouchableOpacity style={styles.input} onPress={() => setShowCatPicker(!showCatPicker)}><Text>{categorie}</Text></TouchableOpacity>
            {showCatPicker && <View style={styles.catPickerContainer}>{categoriesDisponibles.map((cat) => <TouchableOpacity key={cat} style={styles.catOption} onPress={() => { setCategorie(cat); setShowCatPicker(false); }}><Text>{cat}</Text></TouchableOpacity>)}</View>}
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}><Text style={styles.dateText}>📅 Date : {selectedDate}</Text></TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}><Text style={styles.dateText}>⏰ Heure : {selectedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text></TouchableOpacity>
            )}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveMatch}><Text style={styles.btnText}>ENREGISTRER</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.btnText}>ANNULER</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showCalendar} transparent><View style={styles.modalContainer}><View style={{backgroundColor: '#FFF', padding: 10, borderRadius: 10}}><Calendar onDayPress={(day: any) => { setSelectedDate(day.dateString); setShowCalendar(false); }} /><TouchableOpacity onPress={() => setShowCalendar(false)}><Text>Annuler</Text></TouchableOpacity></View></View></Modal>
      {showTimePicker && <DateTimePicker value={selectedTime} mode="time" onChange={(e: any, d?: Date) => { setShowTimePicker(false); if(d) setSelectedTime(d); }} />}
      
      <Modal visible={buteurModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Buteur ?</Text>
            <TextInput style={styles.input} placeholder="Nom (facultatif)" value={buteurEnCours} onChangeText={setButeurEnCours} />
            <TouchableOpacity style={styles.submitBtn} onPress={validerBut}><Text style={styles.btnText}>Valider</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setButeurModalVisible(false)}><Text style={{color: '#888', textAlign: 'center'}}>Annuler</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backText: { color: '#C5A059', fontWeight: 'bold' },
  title: { color: '#C5A059', fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: '#C5A059', padding: 8, borderRadius: 5 },
  card: { backgroundColor: '#0F2241', padding: 15, borderRadius: 10, marginHorizontal: 20, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  actions: { flexDirection: 'row' },
  matchDate: { color: '#C5A059', fontSize: 12 },
  matchTitle: { color: '#FFF', fontSize: 18, marginBottom: 10, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreBox: { alignItems: 'center' },
  score: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
  controls: { flexDirection: 'row', marginTop: 5, gap: 10 },
  btnPlus: { backgroundColor: '#10B981', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5 },
  btnMinus: { backgroundColor: '#EF4444', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 5 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#0F2241', padding: 20, borderRadius: 15 },
  sectionTitle: { color: '#C5A059', fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  input: { backgroundColor: '#FFF', padding: 12, marginBottom: 10, borderRadius: 5 },
  dateButton: { backgroundColor: '#1E3A8A', padding: 15, borderRadius: 5, marginBottom: 10 },
  dateText: { color: '#FFF' },
  submitBtn: { backgroundColor: '#C5A059', padding: 15, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  catPickerContainer: { backgroundColor: '#FFF', marginBottom: 10, borderRadius: 5, padding: 5 },
  cancelBtn: { backgroundColor: '#EF4444', padding: 15, alignItems: 'center', borderRadius: 5, marginTop: 10 },
  catOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' }
});