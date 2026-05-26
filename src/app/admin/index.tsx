import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../supabaseClient';

function AdminDashboard() {
  const router = useRouter();
  
  // États existants
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [loadingWhiteList, setLoadingWhiteList] = useState(false);

  const [actuTitle, setActuTitle] = useState('');
  const [actuCategory, setActuCategory] = useState('SÉNIORS');
  const [actuEmoji, setActuEmoji] = useState('⚽');
  const [actuDescription, setActuDescription] = useState('');
  const [loadingActu, setLoadingActu] = useState(false);

  const [matchCategory, setMatchCategory] = useState('SÉNIORS');
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchLocation, setMatchLocation] = useState('');
  const [matchIsHome, setMatchIsHome] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);

  // ÉLÉMENTS DU SÉLECTEUR DE DATE MAISON
  const [SelectedJourNom, setSelectedJourNom] = useState('Dimanche');
  const [SelectedJourNum, setSelectedJourNum] = useState('24');
  const [SelectedMois, setSelectedMois] = useState('Mai');

  // ÉLÉMENTS DU SÉLECTEUR D'HEURE MAISON (Nouveau !)
  const [SelectedHeure, setSelectedHeure] = useState('15');
  const [SelectedMinute, setSelectedMinute] = useState('00');

  const joursNoms = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const joursNumeros = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const moisListe = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  // Tableaux pour l'heure
  const heuresListe = Array.from({ length: 24 }, (_, i) => i < 10 ? `0${i}` : String(i));
  const minutesListe = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  
  const emojisDisponibles = ['⚽', '🏆', '📢', '🔥', '💪', '🚌', '🍕', '🩹'];

  // Fonction universelle pour faire défiler les listes
  const faireDefiler = (actuel: string, liste: string[], direction: number, setFonction: (val: string) => void) => {
    const indexActuel = liste.indexOf(actuel);
    let nouvelIndex = indexActuel + direction;
    if (nouvelIndex >= liste.length) nouvelIndex = 0;
    if (nouvelIndex < 0) nouvelIndex = liste.length - 1;
    setFonction(liste[nouvelIndex]);
  };

  // FONCTION CRÉER MATCH
  const handleCreateMatch = async () => {
    if (!matchOpponent || !matchLocation) {
      alert("Veuillez remplir le nom de l'adversaire et le stade.");
      return;
    }
    
    // Assemblage automatique de la date et de l'heure
    const dateFinale = `${SelectedJourNom} ${SelectedJourNum} ${SelectedMois}`;
    const heureFinale = `${SelectedHeure}h${SelectedMinute}`;
    
    setLoadingMatch(true);
    try {
      const { error } = await supabase
        .from('matches')
        .insert([{
          category: matchCategory.toUpperCase().trim(),
          opponent: matchOpponent.trim(),
          location: matchLocation.trim(),
          time: heureFinale, // Envoie "15h00" par exemple
          date: dateFinale,
          is_home: matchIsHome
        }]);

      if (error) throw error;
      alert(`📅 Match contre ${matchOpponent} planifié à ${heureFinale} !`);
      setMatchOpponent(''); setMatchLocation('');
    } catch (error: any) {
      alert("Erreur match : " + error.message);
    } finally {
      setLoadingMatch(false);
    }
  };

  // Les autres fonctions (Liste Blanche / Actu) restent identiques
  const handleAddLicencie = async () => {
    if (!newEmail) { alert("Veuillez renseigner un e-mail."); return; }
    setLoadingWhiteList(true);
    try {
      const { error } = await supabase.from('licencies_autorises').insert([{ email: newEmail.toLowerCase().trim(), nom_prenom: newName.trim(), est_admin: isAdminChecked }]);
      if (error) throw error;
      alert(`✅ ${newEmail} ajouté !`);
      setNewEmail(''); setNewName(''); setIsAdminChecked(false);
    } catch (error: any) { alert("Erreur : " + error.message); } finally { setLoadingWhiteList(false); }
  };

  const handlePublishActu = async () => {
    if (!actuTitle || !actuDescription) { alert("Veuillez remplir le titre et le contenu."); return; }
    setLoadingActu(true);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const dateAujourdhui = new Date().toLocaleDateString('fr-FR', options);
    const couleursActu = ['#1E3A8A', '#065F46', '#991B1B', '#374151', '#5B21B6'];
    try {
      const { error } = await supabase.from('news').insert([{ title: actuTitle.trim(), category: actuCategory.toUpperCase(), description: actuDescription.trim(), emoji: actuEmoji, date: dateAujourdhui, color: couleursActu[Math.floor(Math.random() * couleursActu.length)] }]);
      if (error) throw error;
      alert("📢 Actualité publiée !"); setActuTitle(''); setActuDescription('');
    } catch (error: any) { alert("Erreur : " + error.message); } finally { setLoadingActu(false); }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backButtonText}>⬅ Retour App</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>PANNEAU DE CONTRÔLE ADMIN</Text>
      </View>

      <View style={styles.content}>
        
        {/* SECTION PROGRAMMER UN MATCH */}
        <View style={styles.cardAdmin}>
          <Text style={styles.sectionTitle}>📅 Programmer un Match</Text>
          
          <TextInput style={styles.input} placeholder="Catégorie (ex: SÉNIORS, U17...)" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={matchCategory} onChangeText={setMatchCategory} />
          <TextInput style={styles.input} placeholder="Nom de l'adversaire" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={matchOpponent} onChangeText={setMatchOpponent} />

          {/* SÉLECTEUR DE DATE MAISON */}
          <Text style={styles.label}>Date du match :</Text>
          <View style={styles.selectorContainer}>
            <View style={styles.pickerColumn}>
              <TouchableOpacity onPress={() => faireDefiler(SelectedJourNom, joursNoms, -1, setSelectedJourNom)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
              <Text style={styles.pickerValue}>{SelectedJourNom}</Text>
              <TouchableOpacity onPress={() => faireDefiler(SelectedJourNom, joursNoms, 1, setSelectedJourNom)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
            </View>
            <View style={styles.pickerColumn}>
              <TouchableOpacity onPress={() => faireDefiler(SelectedJourNum, joursNumeros, -1, setSelectedJourNum)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
              <Text style={styles.pickerValue}>{SelectedJourNum}</Text>
              <TouchableOpacity onPress={() => faireDefiler(SelectedJourNum, joursNumeros, 1, setSelectedJourNum)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
            </View>
            <View style={styles.pickerColumn}>
              <TouchableOpacity onPress={() => faireDefiler(SelectedMois, moisListe, -1, setSelectedMois)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
              <Text style={styles.pickerValue}>{SelectedMois}</Text>
              <TouchableOpacity onPress={() => faireDefiler(SelectedMois, moisListe, 1, setSelectedMois)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
            </View>
          </View>

          {/* SÉLECTEUR D'HEURE MAISON (Nouveau !) */}
          <Text style={styles.label}>Heure du RDV / Match :</Text>
          <View style={[styles.selectorContainer, { maxWidth: 220, alignSelf: 'flex-start' }]}>
            {/* Colonne Heures */}
            <View style={styles.pickerColumn}>
              <TouchableOpacity onPress={() => faireDefiler(SelectedHeure, heuresListe, -1, setSelectedHeure)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
              <Text style={styles.pickerValue}>{SelectedHeure} h</Text>
              <TouchableOpacity onPress={() => faireDefiler(SelectedHeure, heuresListe, 1, setSelectedHeure)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
            </View>

            {/* Deux points de séparation stylés */}
            <View style={{ justifyContent: 'center', paddingHorizontal: 5 }}>
              <Text style={{ color: '#C5A059', fontWeight: 'bold', fontSize: 16 }}>:</Text>
            </View>

            {/* Colonne Minutes */}
            <View style={styles.pickerColumn}>
              <TouchableOpacity onPress={() => faireDefiler(SelectedMinute, minutesListe, -1, setSelectedMinute)} style={styles.arrowBtn}><Text style={styles.arrowText}>▲</Text></TouchableOpacity>
              <Text style={styles.pickerValue}>{SelectedMinute}</Text>
              <TouchableOpacity onPress={() => faireDefiler(SelectedMinute, minutesListe, 1, setSelectedMinute)} style={styles.arrowBtn}><Text style={styles.arrowText}>▼</Text></TouchableOpacity>
            </View>
          </View>

          <TextInput style={styles.input} placeholder="Stade / Adresse" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={matchLocation} onChangeText={setMatchLocation} />

          <Text style={styles.label}>Lieu de la rencontre :</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleButton, matchIsHome && styles.toggleButtonActive]} onPress={() => setMatchIsHome(true)}><Text style={[styles.toggleButtonText, matchIsHome && styles.toggleButtonTextActive]}>🏠 DOMICILE</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, !matchIsHome && styles.toggleButtonActiveExt]} onPress={() => setMatchIsHome(false)}><Text style={[styles.toggleButtonText, !matchIsHome && styles.toggleButtonTextActive]}>🚌 EXTÉRIEUR</Text></TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#C5A059' }]} onPress={handleCreateMatch} disabled={loadingMatch}>
            {loadingMatch ? <ActivityIndicator color="#0F2241" /> : <Text style={styles.submitButtonText}>CRÉER LA RENCONTRE</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        {/* SECTION ACTUALITÉS */}
        <View style={styles.cardAdmin}>
          <Text style={styles.sectionTitle}>📢 Publier une Actualité</Text>
          <TextInput style={styles.input} placeholder="Titre de l'actualité" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={actuTitle} onChangeText={setActuTitle} />
          <TextInput style={styles.input} placeholder="Catégorie" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={actuCategory} onChangeText={setActuCategory} />
          <Text style={styles.label}>Choisir un émoji :</Text>
          <View style={styles.emojiRow}>
            {emojisDisponibles.map((emo) => (
              <TouchableOpacity key={emo} style={[styles.emojiButton, actuEmoji === emo && styles.emojiButtonActive]} onPress={() => setActuEmoji(emo)}><Text style={styles.emojiText}>{emo}</Text></TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, styles.textArea]} placeholder="Contenu de l'article..." placeholderTextColor="rgba(255, 255, 255, 0.5)" value={actuDescription} onChangeText={setActuDescription} multiline numberOfLines={4} />
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#10B981' }]} onPress={handlePublishActu} disabled={loadingActu}>
            {loadingActu ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>PUBLIER L'ARTICLE</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        {/* SECTION LISTE BLANCHE */}
        <View style={styles.cardAdmin}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Autoriser un nouveau licencié</Text>
          <TextInput style={styles.input} placeholder="Adresse Email" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Nom / Prénom" placeholderTextColor="rgba(255, 255, 255, 0.5)" value={newName} onChangeText={setNewName} />
          <TouchableOpacity style={[styles.checkboxRow, isAdminChecked && styles.checkboxRowActive]} onPress={() => setIsAdminChecked(!isAdminChecked)}><Text style={styles.checkboxText}>{isAdminChecked ? "👑 En faire un ADMINISTRATEUR" : "🏃‍♂️ En faire un JOUEUR normal"}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddLicencie} disabled={loadingWhiteList}>{loadingWhiteList ? <ActivityIndicator color="#0F2241" /> : <Text style={styles.submitButtonText}>VALIDER L'AUTORISATION</Text>}</TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#061329' },
  header: { backgroundColor: '#1E293B', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingBottom: 20, alignItems: 'center' },
  backButton: { position: 'absolute', left: 15, top: Platform.OS === 'ios' ? 50 : 20, backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 10 },
  backButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#C5A059', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  content: { padding: 15, maxWidth: 450, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  cardAdmin: { backgroundColor: '#0F2241', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { color: '#C5A059', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, marginTop: 5 },
  input: { width: '100%', height: 50, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 15, color: '#FFFFFF', marginBottom: 15, backgroundColor: 'rgba(255, 255, 255, 0.02)', justifyContent: 'center' },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  
  // DESIGN DES SÉLECTEURS HARMONISÉS (DATE & HEURE)
  selectorContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)', padding: 8, marginBottom: 15, justifyContent: 'space-between' },
  pickerColumn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  arrowBtn: { paddingVertical: 4, width: '100%', alignItems: 'center' },
  arrowText: { color: '#C5A059', fontSize: 12 },
  pickerValue: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginVertical: 2 },

  toggleRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  toggleButton: { flex: 1, height: 45, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#C5A059', borderColor: '#C5A059' },
  toggleButtonActiveExt: { backgroundColor: '#334155', borderColor: '#334155' },
  toggleButtonText: { color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: 13 },
  toggleButtonTextActive: { color: '#0F2241' },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emojiButton: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  emojiButtonActive: { backgroundColor: 'rgba(197, 160, 89, 0.2)', borderColor: '#C5A059' },
  emojiText: { fontSize: 18 },
  checkboxRow: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 20, alignItems: 'center' },
  checkboxRowActive: { backgroundColor: 'rgba(197, 160, 89, 0.15)', borderColor: '#C5A059' },
  checkboxText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  submitButton: { width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#0F2241', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  separator: { height: 25 }
});

export default AdminDashboard;