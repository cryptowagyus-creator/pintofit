import React, { useState, useRef, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { t } from '../utils/i18n';
import { getUserKey } from '../data/family';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY;

// ─── Shared helpers ─────────────────────────────────────────────────────────

function SegmentControl({ value, onChange }) {
  return (
    <View style={seg.wrapper}>
      <TouchableOpacity
        style={[seg.btn, value === 'photo' && seg.btnActive]}
        onPress={() => onChange('photo')}
        activeOpacity={0.8}
      >
        <Ionicons name="image-outline" size={15} color={value === 'photo' ? colors.white : colors.textSecondary} />
        <Text style={[seg.label, value === 'photo' && seg.labelActive]}>Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[seg.btn, value === 'voice' && seg.btnActive]}
        onPress={() => onChange('voice')}
        activeOpacity={0.8}
      >
        <Ionicons name="mic-outline" size={15} color={value === 'voice' ? colors.white : colors.textSecondary} />
        <Text style={[seg.label, value === 'voice' && seg.labelActive]}>Voice</Text>
      </TouchableOpacity>
    </View>
  );
}

const seg = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    padding: 3,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  btnActive: { backgroundColor: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  labelActive: { color: colors.white },
});

// ─── Photo estimator ─────────────────────────────────────────────────────────

function PhotoEstimator({ currentUser }) {
  const userKey = getUserKey(currentUser);
  const mealStorageKey = `pintofit_meals_${userKey}`;

  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mealName, setMealName] = useState('');
  const [logMessage, setLogMessage] = useState(null);

  const getMimeType = (asset) => {
    if (asset?.mimeType?.startsWith('image/')) return asset.mimeType;
    const ext = asset?.uri?.split('?')[0].split('.').pop()?.toLowerCase();
    return { png: 'image/png', gif: 'image/gif', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', heic: 'image/heic', heif: 'image/heif' }[ext] || 'image/jpeg';
  };

  const pickImage = async () => {
    setResult(null); setError(null); setLogMessage(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setImage(a.uri); setImageBase64(a.base64); setImageMimeType(getMimeType(a));
    }
  };

  const takePhoto = async () => {
    setResult(null); setError(null); setLogMessage(null);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Camera permission required.'); return; }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      setImage(a.uri); setImageBase64(a.base64); setImageMimeType(getMimeType(a));
    }
  };

  const estimate = async () => {
    if (!imageBase64) return;
    if (!ANTHROPIC_KEY) { setError('API key not set. Add EXPO_PUBLIC_ANTHROPIC_KEY.'); return; }
    setLoading(true); setError(null); setResult(null); setLogMessage(null);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-opus-4-6',
          max_tokens: 128,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: imageMimeType, data: imageBase64 } },
            { type: 'text', text: 'Estimate the total calories in this meal image. Respond with only one integer number. No words, ranges, explanations, punctuation, markdown, or extra text. If not food, respond with 0.' },
          ]}],
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const parsed = parseInt((data.content?.[0]?.text || '').replace(/[^\d]/g, ''), 10);
      if (Number.isNaN(parsed)) throw new Error('Could not read a calorie estimate.');
      setResult(parsed);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const logMeal = async () => {
    if (result == null) return;
    const entry = { id: `${Date.now()}`, type: 'Meal', name: mealName.trim() || 'Estimated meal', calories: result };
    const raw = await AsyncStorage.getItem(mealStorageKey);
    const existing = raw ? JSON.parse(raw) : {};
    const idx = new Date().getDay();
    await AsyncStorage.setItem(mealStorageKey, JSON.stringify({ ...existing, [idx]: [...(existing[idx] || []), entry] }));
    setLogMessage(t(currentUser, `Logged ${entry.name} for today.`, `${entry.name} fue registrado para hoy.`));
  };

  const reset = () => { setImage(null); setImageBase64(null); setImageMimeType('image/jpeg'); setResult(null); setError(null); setMealName(''); setLogMessage(null); };

  return (
    <View style={ph.root}>
      {!image ? (
        <View style={ph.uploadCard}>
          <Ionicons name="image-outline" size={36} color={colors.textMuted} />
          <Text style={ph.uploadTitle}>{t(currentUser, 'Select a photo', 'Selecciona una foto')}</Text>
          <Text style={ph.uploadSub}>{t(currentUser, 'The estimator returns one calorie number.', 'El estimador devuelve un numero de calorias.')}</Text>
          <View style={ph.uploadBtns}>
            <TouchableOpacity style={ph.uploadBtn} onPress={pickImage}>
              <Ionicons name="images-outline" size={17} color={colors.blue} />
              <Text style={[ph.uploadBtnText, { color: colors.blue }]}>{t(currentUser, 'Gallery', 'Galeria')}</Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={ph.uploadBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={17} color={colors.text} />
                <Text style={ph.uploadBtnText}>{t(currentUser, 'Camera', 'Camara')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <>
          <View style={ph.previewWrapper}>
            <Image source={{ uri: image }} style={ph.preview} resizeMode="cover" />
            <TouchableOpacity style={ph.removeBtn} onPress={reset}>
              <Ionicons name="close-circle-outline" size={22} color={colors.textSecondary} />
              <Text style={ph.removeBtnText}>{t(currentUser, 'Remove', 'Quitar')}</Text>
            </TouchableOpacity>
          </View>
          {!result && (
            <TouchableOpacity style={[ph.analyzeBtn, loading && { opacity: 0.5 }]} onPress={estimate} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="sparkles-outline" size={16} color={colors.white} />}
              <Text style={ph.analyzeBtnText}>{loading ? t(currentUser, 'Analyzing...', 'Analizando...') : t(currentUser, 'Estimate Calories', 'Estimar calorias')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {error && (
        <View style={ph.errorCard}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
          <Text style={ph.errorText}>{error}</Text>
        </View>
      )}

      {result != null && (
        <View style={ph.resultCard}>
          <View style={ph.resultHeader}>
            <Text style={ph.resultLabel}>{t(currentUser, 'CALORIES', 'CALORIAS')}</Text>
            <TouchableOpacity onPress={reset}><Text style={ph.newPhoto}>{t(currentUser, 'New photo', 'Nueva foto')}</Text></TouchableOpacity>
          </View>
          <Text style={ph.resultNumber}>{result}</Text>
          <Text style={ph.resultUnit}>{t(currentUser, 'estimated calories', 'calorias estimadas')}</Text>
          <TextInput value={mealName} onChangeText={setMealName} placeholder={t(currentUser, 'Meal name', 'Nombre de la comida')} placeholderTextColor={colors.textMuted} style={ph.input} />
          <TouchableOpacity style={ph.logBtn} onPress={logMeal} activeOpacity={0.85}>
            <Text style={ph.logBtnText}>{t(currentUser, 'Log meal for today', 'Registrar comida para hoy')}</Text>
          </TouchableOpacity>
          {logMessage ? <Text style={ph.logMsg}>{logMessage}</Text> : null}
        </View>
      )}
    </View>
  );
}

const ph = StyleSheet.create({
  root: { gap: 12 },
  uploadCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.border },
  uploadTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 8 },
  uploadSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  uploadBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bg, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  uploadBtnText: { fontSize: 15, fontWeight: '500', color: colors.text },
  previewWrapper: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.card },
  preview: { width: '100%', height: 240 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, justifyContent: 'center' },
  removeBtnText: { fontSize: 14, color: colors.textSecondary },
  analyzeBtn: { marginHorizontal: 16, backgroundColor: colors.text, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  analyzeBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: colors.red },
  errorText: { flex: 1, color: colors.red, fontSize: 14, lineHeight: 20 },
  resultCard: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 20, gap: 14, borderWidth: 1, borderColor: colors.border },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5 },
  newPhoto: { fontSize: 14, color: colors.blue },
  resultNumber: { fontSize: 42, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  resultUnit: { fontSize: 14, color: colors.textSecondary, marginTop: -4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.text },
  logBtn: { backgroundColor: colors.text, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  logBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  logMsg: { fontSize: 14, color: colors.green, fontWeight: '600' },
});

// ─── Voice tracker ────────────────────────────────────────────────────────────

function VoiceTracker({ currentUser }) {
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
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) setSupported(false);
    } else {
      setSupported(false);
    }
  }, []);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setError(null); setCurrentTranscript('');
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
    rec.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += txt) : (interim += txt);
      }
      setCurrentTranscript((prev) => {
        const base = (prev.replace(/\s*\[.*\]$/, '') + ' ' + final).trim();
        return interim ? `${base} [${interim}]` : base;
      });
    };
    rec.onerror = (e) => { setError(`Mic error: ${e.error}`); setIsRecording(false); };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setIsRecording(false);
    const raw = currentTranscript.replace(/\s*\[.*\]$/, '').trim();
    if (raw) setRecordings((prev) => [...prev, { id: Date.now(), text: raw, timestamp: new Date().toLocaleTimeString() }]);
    setCurrentTranscript('');
  };

  const analyzeCalories = async () => {
    if (!recordings.length) return;
    if (!ANTHROPIC_KEY) { setError('API key not set. Add EXPO_PUBLIC_ANTHROPIC_KEY.'); return; }
    setLoading(true); setError(null); setCalorieResult(null);
    const allText = recordings.map((r, i) => `Item ${i + 1}: ${r.text}`).join('\n');
    const prompt = `I recorded these ingredients:\n\n${allText}\n\nWhat is the total calorie count? Respond with only one integer number. No words, ranges, or explanations.`;
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 64, messages: [{ role: 'user', content: prompt }] }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e?.error?.message || `Error ${res.status}`); }
      const data = await res.json();
      const parsed = parseInt((data.content?.[0]?.text || '').replace(/[^\d]/g, ''), 10);
      if (Number.isNaN(parsed)) throw new Error('Could not parse a calorie number.');
      setCalorieResult(parsed);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const liveText = currentTranscript.replace(/\s*\[.*\]$/, '').trim();
  const interimMatch = currentTranscript.match(/\[([^\]]+)\]$/);
  const interimText = interimMatch ? interimMatch[1] : '';

  return (
    <View style={vc.root}>
      {!supported && (
        <View style={vc.warnCard}>
          <Ionicons name="alert-circle-outline" size={18} color="#FF9500" />
          <Text style={vc.warnText}>Speech recognition requires Chrome or Edge on desktop.</Text>
        </View>
      )}

      <View style={vc.micSection}>
        <TouchableOpacity style={[vc.micBtn, isRecording && vc.micBtnActive]} onPress={isRecording ? stopRecording : startRecording} disabled={!supported} activeOpacity={0.8}>
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={40} color={isRecording ? colors.red : colors.white} />
        </TouchableOpacity>
        <Text style={vc.micLabel}>
          {isRecording ? 'Tap to stop' : recordings.length === 0 ? 'Tap to start recording' : 'Tap to add another item'}
        </Text>
      </View>

      {isRecording && (
        <View style={vc.liveCard}>
          <View style={vc.liveIndicator}><View style={vc.liveDot} /><Text style={vc.liveLabel}>RECORDING</Text></View>
          <Text style={vc.liveText}>
            {liveText || 'Listening...'}
            {interimText ? <Text style={vc.interimText}> {interimText}</Text> : null}
          </Text>
        </View>
      )}

      {recordings.length > 0 && (
        <View style={vc.list}>
          <View style={vc.listHeader}>
            <Text style={vc.listTitle}>Session ({recordings.length} item{recordings.length !== 1 ? 's' : ''})</Text>
            <TouchableOpacity onPress={() => { setRecordings([]); setCalorieResult(null); setError(null); }}>
              <Text style={vc.clearText}>Clear all</Text>
            </TouchableOpacity>
          </View>
          {recordings.map((r, i) => (
            <View key={r.id} style={vc.card}>
              <View style={vc.idx}><Text style={vc.idxText}>{i + 1}</Text></View>
              <View style={vc.cardBody}><Text style={vc.cardText}>{r.text}</Text><Text style={vc.cardTime}>{r.timestamp}</Text></View>
              <TouchableOpacity onPress={() => { setRecordings((p) => p.filter((x) => x.id !== r.id)); setCalorieResult(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {error && (
        <View style={vc.errorCard}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
          <Text style={vc.errorText}>{error}</Text>
        </View>
      )}

      {recordings.length > 0 && (
        <View style={vc.analyzeSection}>
          {calorieResult == null ? (
            <TouchableOpacity style={[vc.analyzeBtn, (loading || isRecording) && { opacity: 0.5 }]} onPress={analyzeCalories} disabled={loading || isRecording} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="sparkles-outline" size={18} color={colors.white} />}
              <Text style={vc.analyzeBtnText}>{loading ? 'Calculating...' : 'Analyze Meal Calories'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={vc.resultCard}>
              <Text style={vc.resultLabel}>TOTAL CALORIES</Text>
              <Text style={vc.resultNumber}>{calorieResult}</Text>
              <Text style={vc.resultUnit}>estimated calories for this meal</Text>
              <TouchableOpacity style={vc.reBtn} onPress={() => { setCalorieResult(null); setError(null); }}>
                <Text style={vc.reBtnText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {recordings.length === 0 && !isRecording && supported && (
        <View style={vc.empty}>
          <Ionicons name="mic-outline" size={48} color={colors.textMuted} />
          <Text style={vc.emptyTitle}>No recordings yet</Text>
          <Text style={vc.emptySub}>{'Tap the mic and say:\n"100 grams of chicken breast"\n"200 grams of brown rice"'}</Text>
        </View>
      )}
    </View>
  );
}

const vc = StyleSheet.create({
  root: { gap: 12 },
  warnCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: '#FFF8EE', borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: '#FF9500' },
  warnText: { flex: 1, color: '#7A4800', fontSize: 14, lineHeight: 20 },
  micSection: { alignItems: 'center', paddingVertical: 20 },
  micBtn: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  micBtnActive: { backgroundColor: '#FFF0EE', borderWidth: 2, borderColor: colors.red },
  micLabel: { marginTop: 12, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  liveCard: { marginHorizontal: 16, backgroundColor: '#F4F4F4', borderRadius: 16, padding: 16, gap: 8 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  liveLabel: { fontSize: 11, fontWeight: '700', color: colors.red, letterSpacing: 0.8 },
  liveText: { fontSize: 16, color: colors.text, lineHeight: 24 },
  interimText: { color: colors.textMuted, fontStyle: 'italic' },
  list: { paddingHorizontal: 16, gap: 8 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.4 },
  clearText: { fontSize: 13, color: colors.textMuted },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.border },
  idx: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  idxText: { fontSize: 13, fontWeight: '700', color: colors.white },
  cardBody: { flex: 1, gap: 4 },
  cardText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  cardTime: { fontSize: 12, color: colors.textMuted },
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: colors.red },
  errorText: { flex: 1, color: colors.red, fontSize: 14, lineHeight: 20 },
  analyzeSection: { paddingHorizontal: 16 },
  analyzeBtn: { backgroundColor: colors.text, borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  resultCard: { backgroundColor: colors.card, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border },
  resultLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2 },
  resultNumber: { fontSize: 72, fontWeight: '800', color: colors.text, letterSpacing: -2, lineHeight: 80 },
  resultUnit: { fontSize: 14, color: colors.textSecondary },
  reBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20 },
  reBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  empty: { alignItems: 'center', paddingHorizontal: 48, paddingTop: 16, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CalorieScreen({ currentUser }) {
  const [mode, setMode] = useState('photo');

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t(currentUser, 'Calorie Estimator', 'Estimador de calorias')}</Text>
          <Text style={s.sub}>{t(currentUser, 'Estimate calories from a photo or by describing your meal with your voice.', 'Estima calorias desde una foto o describiendo tu comida con tu voz.')}</Text>
        </View>
        <SegmentControl value={mode} onChange={setMode} />
        {mode === 'photo' ? <PhotoEstimator currentUser={currentUser} /> : <VoiceTracker currentUser={currentUser} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: 120 },
  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 20 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 6, lineHeight: 22, marginBottom: 20 },
});
