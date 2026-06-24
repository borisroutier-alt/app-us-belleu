import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Permission de notification refusée !');
        return;
      }
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  const handleLogin = () => {
    console.log('Connexion avec :', email, password);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/150' }} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.clubName}>U.S. BELLEU</Text>
          <Text style={styles.appName}>CONNECT</Text>
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
            placeholder="Mot de Passe"
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>SE CONNECTER</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer}>
            <Text style={styles.linkText}>Créer un compte club / Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2241' },
  innerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 140, height: 140, marginBottom: 15 },
  clubName: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
  appName: { fontSize: 20, color: '#FFFFFF', letterSpacing: 4, marginTop: 5 },
  formContainer: { width: '100%', maxWidth: 320 },
  input: {
    width: '100%', height: 55, borderColor: '#FFFFFF', borderWidth: 1.5,
    borderRadius: 27, paddingHorizontal: 20, color: '#FFFFFF', fontSize: 16,
    marginBottom: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  button: {
    width: '100%', height: 55, backgroundColor: '#C5A059', borderRadius: 27,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  buttonText: { color: '#0F2241', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  linkContainer: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#FFFFFF', fontSize: 13, opacity: 0.8 },
});