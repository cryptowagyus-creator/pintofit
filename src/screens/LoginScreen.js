import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors } from '../theme/colors';

export default function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function submitLogin() {
    const success = await onLogin(name);
    if (success) {
      setError('');
      return;
    }
    setError('Name not found.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.container}>
        <View style={styles.logoZone}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.cardZone}>
        <View style={styles.card}>
          <Text style={styles.title}>Family Login</Text>
          <Text style={styles.subtitle}>Type your name to open your dashboard.</Text>
          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (error) setError('');
            }}
            placeholder="Enter your name"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={submitLogin}
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={submitLogin} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Enter Dashboard</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoZone: {
    alignItems: 'center',
    width: '100%',
    paddingTop: 8,
    paddingBottom: 12,
  },
  cardZone: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 360, height: 132, marginBottom: 18 },
  card: {
    width: '100%',
    marginTop: -40,
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 6, marginBottom: 18, lineHeight: 21 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    marginTop: 14,
    backgroundColor: colors.text,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  error: { marginTop: 12, color: colors.red, fontSize: 14, fontWeight: '500' },
});
