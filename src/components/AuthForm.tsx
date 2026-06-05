import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../supabaseClient';

// @ts-ignore
import LogoClub from '../../assets/images/logo_club.png';

interface AuthFormProps {
    onLoginSuccess: () => void;
}

export default function AuthForm({ onLoginSuccess }: AuthFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegisterMode, setIsRegisterMode] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            alert('Veuillez remplir tous les champs.');
            return;
        }

        setIsLoading(true);
        const emailFormate = email.toLowerCase().trim();

        console.log("=== Tentative d'authentification ===");
        console.log("Mode inscription :", isRegisterMode);
        console.log("Email saisi et nettoyé :", emailFormate);

        if (isRegisterMode) {
            try {
                console.log("Vérification dans la table licencies_autorises...");
                const { data: estAutorise, error: checkError } = await supabase
                    .from('licencies_autorises')
                    .select('email')
                    .eq('email', emailFormate)
                    .maybeSingle();

                if (checkError) {
                    console.error("Erreur Supabase lors de la recherche :", checkError);
                    throw new Error("Impossible de vérifier la liste des licenciés pour le moment.");
                }

                if (!estAutorise || !estAutorise.email) {
                    alert("🚫 Inscription refusée.\n\nCet e-mail n'est pas enregistré dans la liste des licenciés de l'U.S. Belleu. Veuillez contacter le secrétariat du club.");
                    setIsLoading(false);
                    return;
                }

                const { error: signUpError } = await supabase.auth.signUp({ 
                    email: emailFormate, 
                    password 
                });
                
                if (signUpError) throw signUpError;

                alert("Compte club créé avec succès ! Bienvenue.");
                onLoginSuccess();

            } catch (error: any) {
                alert("Erreur : " + error.message);
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ 
                email: emailFormate, 
                password 
            });
            if (error) {
                alert("Erreur de connexion : " + error.message);
            } else {
                onLoginSuccess();
            }
        }
        setIsLoading(false);
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.container}
        >
            <StatusBar barStyle="light-content" />
            <View style={styles.innerContainer}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoContainerFinal}>
                        <Image source={LogoClub} style={styles.finalLogoImage} resizeMode="contain" />
                    </View>
                    <Text style={styles.clubName}>U.S. BELLEU</Text>
                    <Text style={styles.appName}>{isRegisterMode ? 'INSCRIPTION' : 'CONNECT'}</Text>
                </View>

                <View style={styles.formContainer}>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Adresse Email Club" 
                        placeholderTextColor="rgba(255, 255, 255, 0.6)" 
                        value={email} 
                        onChangeText={setEmail} 
                        keyboardType="email-address" 
                        autoCapitalize="none" 
                    />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Mot de Passe (6 caractères min)" 
                        placeholderTextColor="rgba(255, 255, 255, 0.6)" 
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry 
                        autoCapitalize="none" 
                    />
                    
                    <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#0F2241" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isRegisterMode ? 'CRÉER MON COMPTE' : 'SE CONNECTER'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.linkContainer} 
                        onPress={() => setIsRegisterMode(!isRegisterMode)}
                    >
                        <Text style={styles.linkText}>
                            {isRegisterMode ? "Déjà un compte ? Connectez-vous" : "Nouveau licencié ? Créer un compte club"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#14294E', justifyContent: 'center', alignItems: 'center' },
    innerContainer: { width: '100%', maxWidth: 400, padding: 30, alignItems: 'center' },
    logoContainer: { alignItems: 'center', marginBottom: 40 },
    logoContainerFinal: { width: 150, height: 150, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    finalLogoImage: { width: '100%', height: '100%' },
    clubName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
    appName: { fontSize: 20, color: '#FFFFFF', letterSpacing: 4, marginTop: 5 },
    formContainer: { width: '100%' },
    input: { width: '100%', height: 55, borderColor: '#FFFFFF', borderWidth: 1.5, borderRadius: 27, paddingHorizontal: 20, color: '#FFFFFF', fontSize: 16, marginBottom: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
    button: { width: '100%', height: 55, backgroundColor: '#C5A059', borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#0F2241', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    linkContainer: { marginTop: 25, alignItems: 'center', padding: 5 },
    linkText: { color: '#FFFFFF', fontSize: 13, opacity: 0.8, textDecorationLine: 'underline' },
});