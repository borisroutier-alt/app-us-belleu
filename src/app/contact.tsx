import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- Utilisé pour corriger la superposition
import { supabase } from '../supabaseClient';

interface MembreComite {
  id: string;
  poste: string;
  nom: string;
  telephone: string;
  email: string;
}

const ContactScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingComite, setLoadingComite] = useState(true);

  // Données dynamiques du comité
  const [organigramme, setOrganigramme] = useState<MembreComite[]>([]);

  // Données du formulaire
  const [destinataire, setDestinataire] = useState<string>('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [nomUtilisateur, setNomUtilisateur] = useState('');

  useEffect(() => {
    // 1. Récupérer l'utilisateur connecté
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setNomUtilisateur(user.email || 'Un adhérent');
      }
    });

    // 2. Charger les membres du comité depuis Supabase
    fetchComite();
  }, []);

  const fetchComite = async () => {
    try {
      const { data, error } = await supabase
        .from('comite_directeur')
        .select('*')
        .order('ordre', { ascending: true });

      if (error) throw error;

      setOrganigramme(data || []);
      
      // Sélectionner le premier membre par défaut pour le formulaire
      if (data && data.length > 0) {
        setDestinataire(data[0].poste);
      }
    } catch (err: any) {
      Alert.alert("Erreur", "Impossible de charger l'organigramme : " + err.message);
    } finally {
      setLoadingComite(false);
    }
  };

  const appelerMembre = (telephone: string) => {
    if (!telephone) return;
    Linking.openURL(`tel:${telephone}`).catch(() => {
      Alert.alert("Erreur", "Impossible de lancer l'appel depuis cet appareil.");
    });
  };

  const envoyerMailDirect = (email: string, poste: string) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}?subject=U.S. Belleu App - Question au ${poste}`).catch(() => {
      Alert.alert("Erreur", "Aucune application de messagerie trouvée.");
    });
  };

  const handleEnvoyerFormulaire = async () => {
    if (!sujet.trim() || !message.trim()) {
      Alert.alert("Attention", "Veuillez remplir le sujet et votre message.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('messages_contact')
        .insert({
          id_utilisateur: user?.id,
          nom_complet: nomUtilisateur,
          sujet: sujet,
          message: message,
          destinataire: destinataire
        });

      if (error) throw error;

      Alert.alert(
        "Message envoyé !",
        `Votre demande a bien été transmise au ${destinataire}. Une réponse vous sera apportée rapidement.`,
        [{ text: "Super", onPress: () => router.back() }]
      );
      
      setSujet('');
      setMessage('');
    } catch (error: any) {
      Alert.alert("Erreur d'envoi", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // CORRECTION : La SafeAreaView locale prend le bleu officiel du club pour l'encoche supérieure
    <SafeAreaView style={styles.safeContainer} edges={['top']}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>⬅ Retour Espace Membre</Text>
        </TouchableOpacity>

        <Text style={styles.pageTitle}>📞 CONTACTER LE CLUB</Text>
        <Text style={styles.pageSubtitle}>Besoin d'un renseignement ? L'équipe de l'U.S. Belleu reste à votre écoute.</Text>

        {/* --- SECTION 1 : CONTACTS DIRECTS --- */}
        <Text style={styles.sectionTitle}>ℹ️ ORGANIGRAMME DU COMITÉ</Text>
        
        {loadingComite ? (
          <ActivityIndicator size="small" color="#C5A059" style={{ marginVertical: 20 }} />
        ) : organigramme.length === 0 ? (
          <Text style={{ color: '#FFF', fontStyle: 'italic', marginBottom: 20 }}>Aucun membre configuré pour le moment.</Text>
        ) : (
          organigramme.map((membre) => (
            <View key={membre.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberPoste}>{membre.poste.toUpperCase()}</Text>
                <Text style={styles.memberName}>{membre.nom}</Text>
              </View>
              <View style={styles.memberActions}>
                {membre.telephone && (
                  <TouchableOpacity style={[styles.miniBtn, styles.btnTel]} onPress={() => appelerMembre(membre.telephone)}>
                    <Text style={styles.btnIconText}>📞 Appeler</Text>
                  </TouchableOpacity>
                )}
                {membre.email && (
                  <TouchableOpacity style={[styles.miniBtn, styles.btnMail]} onPress={() => envoyerMailDirect(membre.email, membre.poste)}>
                    <Text style={styles.btnIconText}>✉️ Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* --- SECTION 2 : FORMULAIRE DE CONTACT INTERNE --- */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>✍️ ENVOYER UN MESSAGE INTERNE</Text>
        <View style={styles.formContainer}>
          
          <Text style={styles.label}>À qui s'adresse votre message ?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
            {organigramme.map((membre) => (
              <TouchableOpacity 
                key={membre.id}
                style={[styles.selectorItem, destinataire === membre.poste && styles.selectorItemActive]}
                onPress={() => setDestinataire(membre.poste)}
              >
                <Text style={[styles.selectorText, destinataire === membre.poste && styles.selectorTextActive]}>
                  {membre.poste}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Sujet du message</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Ex: Problème de licence, Convocation..." 
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={sujet}
            onChangeText={setSujet}
          />

          <Text style={styles.label}>Votre message</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Écrivez votre texte ici..." 
            placeholderTextColor="rgba(255,255,255,0.4)"
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleEnvoyerFormulaire} disabled={loading || loadingComite}>
            {loading ? (
              <ActivityIndicator color="#14294E" />
            ) : (
              <Text style={styles.submitButtonText}>🚀 TRANSMETTRE MA DEMANDE</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // CORRECTION : Nouveau conteneur de sécurité avec le vrai bleu de l'U.S. Belleu
  safeContainer: { flex: 1, backgroundColor: '#14294E' },
  container: { flex: 1, backgroundColor: '#061329' },
  
  // Remplacement de #0F2241 par le bleu officiel du club #14294E pour harmoniser avec le logo
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#14294E', borderRadius: 15, marginBottom: 20 },
  backText: { color: '#C5A059', fontWeight: 'bold', fontSize: 13 },
  pageTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  pageSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 5, lineHeight: 20, marginBottom: 25 },
  sectionTitle: { color: '#C5A059', fontSize: 14, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
  
  memberCard: { flexDirection: 'row', backgroundColor: '#14294E', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  memberInfo: { flex: 1 },
  memberPoste: { color: '#C5A059', fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  memberName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  memberActions: { flexDirection: 'row', gap: 8 },
  miniBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnTel: { backgroundColor: '#10B981' },
  btnMail: { backgroundColor: '#3B82F6' },
  btnIconText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  
  formContainer: { backgroundColor: '#14294E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  label: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  selectorRow: { flexDirection: 'row', marginBottom: 10 },
  selectorItem: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
  selectorItemActive: { backgroundColor: 'rgba(197, 160, 89, 0.15)', borderColor: '#C5A059' },
  selectorText: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 'bold' },
  selectorTextActive: { color: '#C5A059' },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: '#FFF', fontSize: 15, marginTop: 4, ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#C5A059', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginTop: 25 },
  submitButtonText: { color: '#14294E', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 }
});

export default ContactScreen;