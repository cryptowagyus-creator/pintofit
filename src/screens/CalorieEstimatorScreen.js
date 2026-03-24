import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function CalorieEstimatorScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    setResult(null);
    setError(null);

    if (Platform.OS === 'web') {
      // Web: use file input via ImagePicker
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]) {
        setImage(res.assets[0].uri);
        setImageBase64(res.assets[0].base64);
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Camera roll permission is required.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]) {
        setImage(res.assets[0].uri);
        setImageBase64(res.assets[0].base64);
      }
    }
  };

  const takePhoto = async () => {
    setResult(null);
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera permission is required.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImage(res.assets[0].uri);
      setImageBase64(res.assets[0].base64);
    }
  };

  const estimateCalories = async () => {
    if (!imageBase64) return;
    if (!ANTHROPIC_KEY) {
      setError('API key not configured. Add EXPO_PUBLIC_ANTHROPIC_KEY in Railway environment variables.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: `You are a nutrition expert. Analyze this food image and provide:

1. **What you see** — identify all food items in the image
2. **Estimated calories** — total calorie estimate with a reasonable range
3. **Macros breakdown** — approximate protein, carbs, and fat in grams
4. **Serving size note** — any assumptions made about portion size

Be practical and direct. If the image is unclear or not food, say so.`,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      setResult(data.content[0].text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#0a1a0a', '#0a0a0a']} style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerEmoji}>🍽️</Text>
          <Text style={styles.headerTitle}>CALORIE<Text style={styles.headerAccent}> ESTIMATOR</Text></Text>
          <Text style={styles.headerSub}>Snap a photo of your meal — Claude AI estimates the calories</Text>
        </LinearGradient>

        <View style={styles.content}>

          {/* Upload Buttons */}
          {!image && (
            <View style={styles.uploadArea}>
              <View style={styles.uploadIcon}>
                <Ionicons name="camera-outline" size={52} color={colors.textMuted} />
              </View>
              <Text style={styles.uploadTitle}>Add a food photo</Text>
              <Text style={styles.uploadSub}>Claude will identify the food and estimate calories</Text>

              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                  <Ionicons name="images-outline" size={20} color="#4caf50" />
                  <Text style={[styles.uploadBtnText, { color: '#4caf50' }]}>Gallery</Text>
                </TouchableOpacity>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                    <Ionicons name="camera-outline" size={20} color="#2196f3" />
                    <Text style={[styles.uploadBtnText, { color: '#2196f3' }]}>Camera</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Image Preview */}
          {image && (
            <View style={styles.previewWrapper}>
              <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeBtn} onPress={reset}>
                <Ionicons name="close-circle" size={28} color={colors.accent} />
              </TouchableOpacity>
            </View>
          )}

          {/* Analyze Button */}
          {imageBase64 && !result && (
            <TouchableOpacity
              style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
              onPress={estimateCalories}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#333', '#222'] : ['#4caf50', '#2e7d32']}
                style={styles.analyzeGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.analyzeBtnText}>Analyzing with Claude...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={20} color="#fff" />
                    <Text style={styles.analyzeBtnText}>Estimate Calories</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Error */}
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Result */}
          {result && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons name="sparkles" size={18} color="#4caf50" />
                <Text style={styles.resultTitle}>Claude's Analysis</Text>
              </View>
              <Text style={styles.resultText}>{result}</Text>
              <TouchableOpacity style={styles.newPhotoBtn} onPress={reset}>
                <Ionicons name="camera-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.newPhotoBtnText}>Analyze another meal</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 20, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerEmoji: { fontSize: 44, marginBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: 2 },
  headerAccent: { color: '#4caf50' },
  headerSub: { fontSize: 14, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

  content: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  uploadArea: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    gap: 10,
  },
  uploadIcon: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  uploadSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadBtnText: { fontSize: 15, fontWeight: '700' },

  previewWrapper: { position: 'relative', borderRadius: 18, overflow: 'hidden' },
  preview: { width: '100%', height: 280, borderRadius: 18 },
  removeBtn: { position: 'absolute', top: 10, right: 10 },

  analyzeBtn: { borderRadius: 16, overflow: 'hidden' },
  analyzeBtnDisabled: { opacity: 0.7 },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.accent + '22',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  errorText: { flex: 1, color: colors.accent, fontSize: 14, lineHeight: 20 },

  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4caf5044',
    gap: 14,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultTitle: { fontSize: 14, fontWeight: '800', color: '#4caf50', letterSpacing: 1 },
  resultText: { color: colors.text, fontSize: 15, lineHeight: 24 },
  newPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 4,
  },
  newPhotoBtnText: { color: colors.textSecondary, fontSize: 13 },
});
