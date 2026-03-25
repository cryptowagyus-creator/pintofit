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

export default function LoginScreen({ onLogin, allowedUsers }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  async function submitLogin() {
    const success = await onLogin(name);
    if (success) {
      setError('');
      return;
    }
    setError('Name not found. Use one of the family names below.');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <View style={styles.container}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
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
        <Text style={styles.listTitle}>Allowed users</Text>
        <Text style={styles.userList}>{allowedUsers.join(' • ')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 160, height: 160, marginBottom: 16 },
  card: {
    width: '100%',
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
  listTitle: { marginTop: 24, fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  userList: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
    maxWidth: 320,
  },
});
