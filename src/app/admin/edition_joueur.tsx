import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../supabaseClient';

export default function EditionJoueur() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [categorie, setCategorie] = useState('Seniors');
  const [poste, setPoste] = useState('Gardien');
  const [posteAutre, setPosteAutre] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Charger les infos du joueur au montage
  useEffect(() => {
    const fetchJoueur = async () => {
      const { data, error } = await supabase
        .from('joueurs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setNom(data.nom);
        setPrenom(data.prenom);
        setCategorie(data.categorie);
        // Vérifier si le poste est un des choix du Picker
        const choixPostes = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant', 'Entraineur'];
        if (choixPostes.includes(data.poste)) {
            setPoste(data.poste);
        } else {
            setPoste('Autre');
            setPosteAutre(data.poste);
        }
      }
    };
    fetchJoueur();
  }, [id]);

  // 2. Mise à jour
  const handleUpdate = async () => {
    const posteFinal = poste === 'Autre' ? posteAutre : poste;
    setLoading(true);
    const { error } = await supabase
      .from('joueurs')
      .update({ nom, prenom, categorie, poste: posteFinal })
      .eq('id', id);
    
    setLoading(false);
    if (error) Alert.alert("Erreur", error.message);
    else {
      Alert.alert("Succès", "Joueur mis à jour !");
      router.back();
    }
  };

  // 3. Suppression
  const handleDelete = () => {
    Alert.alert("Confirmation", "Voulez-vous vraiment supprimer ce joueur ?", [
      { text: "Annuler" },
      { text: "Supprimer", style: 'destructive', onPress: async () => {
          setLoading(true);
          await supabase.from('joueurs').delete().eq('id', id);
          setLoading(false);
          router.back();
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>MODIFIER / SUPPRIMER</Text>
        
        <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Nom" />
        <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Prénom" />
        
        <View style={styles.pickerContainer}>
          <Picker selectedValue={categorie} onValueChange={setCategorie} style={styles.picker}>
             {['Seniors', 'U18', 'U17', 'U15', 'U13', 'U11', 'U9', 'Dirigeants'].map(c => <Picker.Item key={c} label={c} value={c} />)}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Picker selectedValue={poste} onValueChange={setPoste} style={styles.picker}>
            {['Gardien', 'Défenseur', 'Milieu', 'Attaquant', 'Entraineur', 'Autre'].map(p => <Picker.Item key={p} label={p} value={p} />)}
          </Picker>
        </View>

        {poste === 'Autre' && (
          <TextInput style={styles.input} value={posteAutre} onChangeText={setPosteAutre} placeholder="Précisez le poste" />
        )}

        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
          <Text style={styles.buttonText}>ENREGISTRER</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444', marginTop: 20 }]} onPress={handleDelete}>
          <Text style={styles.buttonText}>SUPPRIMER CE JOUEUR</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#061329' },
  container: { padding: 20 },
  title: { color: '#C5A059', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#14294E', color: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15 },
  pickerContainer: { backgroundColor: '#14294E', borderRadius: 8, marginBottom: 15 },
  picker: { color: '#FFF', height: 50 },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' }
});