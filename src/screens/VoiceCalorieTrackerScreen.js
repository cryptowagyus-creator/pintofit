import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

export default function VoiceCalorieTrackerScreen({ currentUser }) {
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [calorieResult, setCalorieResult] = useState(null);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        setSupported(false);
      }
    } else {
      setSupported(false);
    }
  }, []);

  const startRecording = () => {
    if (Platform.OS !== 'web') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    setError(null);
    setCurrentTranscript('');

    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      setCurrentTranscript((prev) => {
        const base = prev.replace(/\s*\[.*\]$/, '');
        const next = (base + ' ' + final).trim();
        return interim ? `${next} [${interim}]` : next;
      });
    };

    recognition.onerror = (e) => {
      setError(`Microphone error: ${e.error}`);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);

    const raw = currentTranscript.replace(/\s*\[.*\]$/, '').trim();
    if (raw) {
      setRecordings((prev) => [
        ...prev,
        { id: Date.now(), text: raw, timestamp: new Date().toLocaleTimeString() },
      ]);
    }
    setCurrentTranscript('');
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const removeRecording = (id) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    setCalorieResult(null);
    setError(null);
  };

  const clearSession = () => {
    if (isRecording) stopRecording();
    setRecordings([]);
    setCalorieResult(null);
    setError(null);
    setCurrentTranscript('');
  };

  const analyzeCalories = async () => {
    if (recordings.length === 0) return;
    if (!ANTHROPIC_KEY) {
      setError('API key not set. Add EXPO_PUBLIC_ANTHROPIC_KEY to your environment.');
      return;
    }

    setLoading(true);
    setError(null);
    setCalorieResult(null);

    const allText = recordings.map((r, i) => `Item ${i + 1}: ${r.text}`).join('\n');

    const prompt = `I'm preparing a meal and recorded the following ingredients with their amounts:\n\n${allText}\n\nBased on these ingredients and quantities, what is the total calorie count for the entire meal? Respond with only one integer number. No words, no ranges, no explanations, no punctuation, no markdown. Just the integer.`;

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
          max_tokens: 64,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `Error ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.content?.[0]?.text?.trim() || '';
      const parsed = parseInt(rawText.replace(/[^\d]/g, ''), 10);

      if (Number.isNaN(parsed)) {
        throw new Error('Could not parse a calorie number from the response.');
      }

      setCalorieResult(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const liveText = currentTranscript.replace(/\s*\[.*\]$/, '').trim();
  const interimMatch = currentTranscript.match(/\[([^\]]+)\]$/);
  const interimText = interimMatch ? interimMatch[1] : '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Tracker</Text>
          <Text style={styles.sub}>
            Tap the mic, say what you're cooking and how many grams. Tap again to save.
          </Text>
        </View>

        {/* Not supported warning */}
        {!supported && (
          <View style={styles.warnCard}>
            <Ionicons name="alert-circle-outline" size={18} color="#FF9500" />
            <Text style={styles.warnText}>
              Speech recognition is only available in Chrome or Edge on desktop. Open this app in a supported browser.
            </Text>
          </View>
        )}

        {/* Mic button */}
        <View style={styles.micSection}>
          <TouchableOpacity
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
            onPress={toggleRecording}
            disabled={!supported}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={40}
              color={isRecording ? colors.red : colors.white}
            />
          </TouchableOpacity>
          <Text style={styles.micLabel}>
            {isRecording ? 'Tap to stop recording' : recordings.length === 0 ? 'Tap to start recording' : 'Tap to add another item'}
          </Text>
        </View>

        {/* Live transcript */}
        {isRecording && (
          <View style={styles.liveCard}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>RECORDING</Text>
            </View>
            <Text style={styles.liveText}>
              {liveText || 'Listening...'}
              {interimText ? <Text style={styles.interimText}> {interimText}</Text> : null}
            </Text>
          </View>
        )}

        {/* Recordings list */}
        {recordings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>This Session ({recordings.length} item{recordings.length !== 1 ? 's' : ''})</Text>
              <TouchableOpacity onPress={clearSession}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            {recordings.map((rec, index) => (
              <View key={rec.id} style={styles.recordingCard}>
                <View style={styles.recordingIndex}>
                  <Text style={styles.recordingIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.recordingBody}>
                  <Text style={styles.recordingText}>{rec.text}</Text>
                  <Text style={styles.recordingTime}>{rec.timestamp}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeRecording(rec.id)}
                  style={styles.removeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Analyze button + result */}
        {recordings.length > 0 && (
          <View style={styles.analyzeSection}>
            {calorieResult == null ? (
              <TouchableOpacity
                style={[styles.analyzeBtn, (loading || isRecording) && styles.analyzeBtnDisabled]}
                onPress={analyzeCalories}
                disabled={loading || isRecording}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Ionicons name="sparkles-outline" size={18} color={colors.white} />
                )}
                <Text style={styles.analyzeBtnText}>
                  {loading ? 'Calculating calories...' : 'Analyze Meal Calories'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>TOTAL CALORIES</Text>
                <Text style={styles.resultNumber}>{calorieResult}</Text>
                <Text style={styles.resultUnit}>estimated calories for this meal</Text>
                <TouchableOpacity
                  style={styles.reAnalyzeBtn}
                  onPress={() => { setCalorieResult(null); setError(null); }}
                >
                  <Text style={styles.reAnalyzeText}>Re-analyze</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Empty state */}
        {recordings.length === 0 && !isRecording && supported && (
          <View style={styles.emptyState}>
            <Ionicons name="mic-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No recordings yet</Text>
            <Text style={styles.emptySub}>
              Tap the mic and say something like:{'\n'}"100 grams of chicken breast" or{'\n'}"200 grams of brown rice"
            </Text>
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

  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 20 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 22 },

  warnCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF8EE',
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  warnText: { flex: 1, color: '#7A4800', fontSize: 14, lineHeight: 20 },

  micSection: { alignItems: 'center', paddingVertical: 24 },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  micBtnActive: {
    backgroundColor: '#FFF0EE',
    borderWidth: 2,
    borderColor: colors.red,
  },
  micLabel: { marginTop: 14, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  liveCard: {
    marginHorizontal: 16,
    backgroundColor: '#F4F4F4',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    gap: 10,
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  liveLabel: { fontSize: 11, fontWeight: '700', color: colors.red, letterSpacing: 0.8 },
  liveText: { fontSize: 16, color: colors.text, lineHeight: 24, fontWeight: '400' },
  interimText: { color: colors.textMuted, fontStyle: 'italic' },

  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.4 },
  clearText: { fontSize: 13, color: colors.textMuted },

  recordingCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recordingIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  recordingIndexText: { fontSize: 13, fontWeight: '700', color: colors.white },
  recordingBody: { flex: 1, gap: 4 },
  recordingText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  recordingTime: { fontSize: 12, color: colors.textMuted },
  removeBtn: { paddingTop: 4 },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
  },
  errorText: { flex: 1, color: colors.red, fontSize: 14, lineHeight: 20 },

  analyzeSection: { paddingHorizontal: 16, marginTop: 8 },
  analyzeBtn: {
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },

  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2 },
  resultNumber: { fontSize: 72, fontWeight: '800', color: colors.text, letterSpacing: -2, lineHeight: 80 },
  resultUnit: { fontSize: 14, color: colors.textSecondary },
  reAnalyzeBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20 },
  reAnalyzeText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
