import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../supabaseClient';

function AdminDashboard() {
  const router = useRouter();
  
  // ÉTATS GESTION LICENCIÉS
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [loadingWhiteList, setLoadingWhiteList] = useState(false);

  // ÉTATS GESTION ACTUALITÉS
  const [actuTitle, setActuTitle] = useState('');
  const [actuCategory, setActuCategory] = useState('SÉNIORS');
  const [actuEmoji, setActuEmoji] = useState('⚽');
  const [actuDescription, setActuDescription] = useState('');
  const [loadingActu, setLoadingActu] = useState(false);

  const emojisDisponibles = ['⚽', '🏆', '📢', '🔥', '💪', '🚌', '🍕', '🩹'];

  // AUTORISER UN LICENCIÉ
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

  // PUBLIER UNE ACTU
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E293B" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>⬅ Retour App</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>U.S. BELLEU</Text>
        <Text style={styles.headerSubtitle}>PANNEAU DE CONTRÔLE ADMIN</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* SECTION GESTION DU CALENDRIER ÉVÉNEMENTIEL */}
          <View style={styles.cardAdmin}>
            <Text style={styles.sectionTitle}>📆 Calendrier Événementiel</Text>
            <Text style={styles.label}>Planifier des événements globaux pour le club (tournois, réunions, stages, festivités...) :</Text>
            
            <TouchableOpacity 
              style={[styles.submitButton, { backgroundColor: '#C5A059', marginTop: 10 }]} 
              onPress={() => router.push('/admin/calendrier-gestion')}
            >
              <Text style={styles.submitButtonText}>OUVRIR LE GESTIONNAIRE</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E293B' },
  scrollView: { flex: 1, backgroundColor: '#061329' },
  header: { 
    backgroundColor: '#1E293B', 
    paddingVertical: 15, 
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative'
  },
  backButton: { 
    position: 'absolute', 
    left: 15, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 8 
  },
  backButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  headerSubtitle: { color: '#C5A059', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  content: { padding: 15, maxWidth: 450, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  cardAdmin: { backgroundColor: '#0F2241', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  sectionTitle: { color: '#C5A059', fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, marginTop: 5 },
  input: { width: '100%', height: 50, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 15, color: '#FFFFFF', marginBottom: 15, backgroundColor: 'rgba(255, 255, 255, 0.02)', justifyContent: 'center' },
  textArea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emojiButton: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  emojiButtonActive: { backgroundColor: 'rgba(197, 160, 89, 0.2)', borderColor: '#C5A059' },
  emojiText: { fontSize: 18 },
  checkboxRow: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 20, alignItems: 'center' },
  checkboxRowActive: { backgroundColor: 'rgba(197, 160, 89, 0.15)', borderColor: '#C5A059' },
  checkboxText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  submitButton: { width: '100%', height: 50, backgroundColor: '#C5A059', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  submitButtonText: { color: '#0F2241', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  separator: { height: 25 }
});

export default AdminDashboard;