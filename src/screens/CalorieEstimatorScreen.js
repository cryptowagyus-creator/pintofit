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
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function CalorieEstimatorScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getMimeType = (uri) => {
    const ext = uri?.split('?')[0].split('.').pop()?.toLowerCase();
    const map = { png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
    return map[ext] || 'image/jpeg';
  };

  const pickImage = async () => {
    setResult(null);
    setError(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!res.canceled && res.assets?.[0]) {
      setImage(res.assets[0].uri);
      setImageBase64(res.assets[0].base64);
      setImageMimeType(getMimeType(res.assets[0].uri));
    }
  };

  const takePhoto = async () => {
    setResult(null);
    setError(null);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { setError('Camera permission required.'); return; }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      setImage(res.assets[0].uri);
      setImageBase64(res.assets[0].base64);
      setImageMimeType(getMimeType(res.assets[0].uri));
    }
  };

  const estimateCalories = async () => {
    if (!imageBase64) return;
    if (!ANTHROPIC_KEY) {
      setError('API key not set. Add EXPO_PUBLIC_ANTHROPIC_KEY in Railway environment variables.');
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
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: imageMimeType, data: imageBase64 },
              },
              {
                type: 'text',
                text: `You are a nutrition expert. Analyze this food image and provide:

1. **What you see** — identify all food items
2. **Estimated calories** — total with a range
3. **Macros** — protein, carbs, fat in grams
4. **Portion note** — assumptions about serving size

Be concise and direct. If it's not food, say so.`,
              },
            ],
          }],
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `Error ${response.status}`);
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
    setImageMimeType('image/jpeg');
    setResult(null);
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Calorie Estimator</Text>
          <Text style={styles.sub}>Upload a photo of your meal for an AI-powered nutrition estimate.</Text>
        </View>

        {/* Upload Area */}
        {!image ? (
          <View style={styles.uploadCard}>
            <Ionicons name="image-outline" size={36} color={colors.textMuted} />
            <Text style={styles.uploadTitle}>Select a photo</Text>
            <Text style={styles.uploadSub}>Claude will identify the food and estimate macros</Text>
            <View style={styles.uploadBtns}>
              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                <Ionicons name="images-outline" size={17} color={colors.blue} />
                <Text style={[styles.uploadBtnText, { color: colors.blue }]}>Gallery</Text>
              </TouchableOpacity>
              {Platform.OS !== 'web' && (
                <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnSecondary]} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={17} color={colors.text} />
                  <Text style={styles.uploadBtnText}>Camera</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.previewWrapper}>
              <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity style={styles.removeBtn} onPress={reset}>
                <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>

            {!result && (
              <TouchableOpacity
                style={[styles.analyzeBtn, loading && { opacity: 0.5 }]}
                onPress={estimateCalories}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons name="sparkles-outline" size={16} color={colors.white} />
                )}
                <Text style={styles.analyzeBtnText}>
                  {loading ? 'Analyzing…' : 'Estimate Calories'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultLabel}>ANALYSIS</Text>
              <TouchableOpacity onPress={reset}>
                <Text style={styles.newPhoto}>New photo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: 120 },

  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28 },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 22 },

  uploadCard: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  uploadTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 8 },
  uploadSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  uploadBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  uploadBtnSecondary: {
    backgroundColor: colors.bg,
  },
  uploadBtnText: { fontSize: 15, fontWeight: '500', color: colors.text },

  previewWrapper: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  preview: { width: '100%', height: 260 },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 14, color: colors.textSecondary },

  analyzeBtn: {
    marginHorizontal: 16,
    backgroundColor: colors.text,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  errorText: { flex: 1, color: colors.red, fontSize: 14, lineHeight: 20 },

  resultCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  newPhoto: { fontSize: 14, color: colors.blue },
  resultText: { fontSize: 15, color: colors.text, lineHeight: 24 },
});
