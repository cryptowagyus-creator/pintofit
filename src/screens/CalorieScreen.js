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

// ─── Voice tracker (Cooking Buddy v2) ────────────────────────────────────────

function VoiceTracker({ currentUser }) {
  const userKey = getUserKey(currentUser);
  const storageKey = `pintofit_voice_log_${userKey}`;

  const [sessionActive, setSessionActive] = useState(false);
  const [entries, setEntries] = useState([]);
  const [liveText, setLiveText] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [calorieResult, setCalorieResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);

  const recognitionRef = useRef(null);
  const sessionActiveRef = useRef(false);
  const sessionIdRef = useRef(null);
  const finalBufferRef = useRef('');
  const restartTimerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!window.SpeechRecognition && !window.webkitSpeechRecognition) setSupported(false);
    } else {
      setSupported(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      setHistoryData(raw ? JSON.parse(raw) : []);
    } catch (_) {}
  };

  const saveEntryToStorage = async (sessionId, entry) => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const sessions = raw ? JSON.parse(raw) : [];
      const idx = sessions.findIndex((s) => s.sessionId === sessionId);
      if (idx >= 0) {
        sessions[idx].entries.push(entry);
        await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
      }
    } catch (_) {}
  };

  const saveCalorieToStorage = async (sessionId, calories) => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const sessions = raw ? JSON.parse(raw) : [];
      const idx = sessions.findIndex((s) => s.sessionId === sessionId);
      if (idx >= 0) {
        sessions[idx].calorieResult = calories;
        await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
      }
    } catch (_) {}
  };

  const addEntry = (text) => {
    const sessionId = sessionIdRef.current;
    if (!sessionId || !sessionActiveRef.current) return;
    const entry = { id: Date.now(), text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setEntries((prev) => [...prev, entry]);
    setCalorieResult(null);
    saveEntryToStorage(sessionId, entry);
  };

  const startRecognitionLoop = () => {
    if (!sessionActiveRef.current || recognitionRef.current) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    finalBufferRef.current = '';
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      let final = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += txt) : (interim += txt);
      }
      if (final) finalBufferRef.current = (finalBufferRef.current + ' ' + final).trim();
      setLiveText((finalBufferRef.current + (interim ? ' ' + interim : '')).trim());
      setReconnecting(false);
    };

    rec.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      setError(`Mic: ${e.error}`);
      setTimeout(() => setError(null), 3000);
    };

    rec.onend = () => {
      recognitionRef.current = null;
      setLiveText('');
      const buffer = finalBufferRef.current.trim();
      finalBufferRef.current = '';

      if (buffer && sessionActiveRef.current) {
        const wakeMatch = buffer.match(/(?:hey\s+)?cooking\s+buddy[,.]?\s*/i);
        if (wakeMatch) {
          const afterWake = buffer.slice(wakeMatch.index + wakeMatch[0].length).trim();
          if (afterWake) addEntry(afterWake);
        }
      }

      if (sessionActiveRef.current) {
        setReconnecting(true);
        restartTimerRef.current = setTimeout(() => {
          setReconnecting(false);
          startRecognitionLoop();
        }, 350);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (_) { recognitionRef.current = null; }
  };

  const startSession = async () => {
    const id = `session_${Date.now()}`;
    sessionIdRef.current = id;
    sessionActiveRef.current = true;
    setSessionActive(true);
    setEntries([]);
    setCalorieResult(null);
    setError(null);
    setLiveText('');

    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const sessions = raw ? JSON.parse(raw) : [];
      sessions.push({
        sessionId: id,
        date: new Date().toLocaleDateString(),
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        entries: [],
        calorieResult: null,
      });
      await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
    } catch (_) {}

    startRecognitionLoop();
  };

  const endSession = () => {
    sessionActiveRef.current = false;
    setSessionActive(false);
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} recognitionRef.current = null; }
    setLiveText('');
    setReconnecting(false);
    loadHistory();
  };

  // App-switching recovery
  useEffect(() => {
    if (!sessionActive || Platform.OS !== 'web') return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && sessionActiveRef.current) {
        if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} recognitionRef.current = null; }
        setReconnecting(true);
        setTimeout(() => startRecognitionLoop(), 500);
      }
    };
    const handleFocus = () => {
      if (sessionActiveRef.current && !recognitionRef.current) startRecognitionLoop();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [sessionActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch (_) {} recognitionRef.current = null; }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, []);

  const analyzeCalories = async () => {
    if (!entries.length) return;
    if (!ANTHROPIC_KEY) { setError('API key not set. Add EXPO_PUBLIC_ANTHROPIC_KEY.'); return; }
    setLoading(true); setError(null); setCalorieResult(null);
    const sid = sessionIdRef.current;
    const prompt = `I recorded these food items:\n\n${entries.map((r, i) => `Item ${i + 1}: ${r.text}`).join('\n')}\n\nWhat is the total calorie count? Respond with only one integer number. No words, ranges, or explanations.`;
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
      if (sid) { await saveCalorieToStorage(sid, parsed); loadHistory(); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const deleteHistoryEntry = async (sessionId, entryId) => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const sessions = raw ? JSON.parse(raw) : [];
      const idx = sessions.findIndex((s) => s.sessionId === sessionId);
      if (idx >= 0) {
        sessions[idx].entries = sessions[idx].entries.filter((e) => e.id !== entryId);
        await AsyncStorage.setItem(storageKey, JSON.stringify(sessions));
        setHistoryData([...sessions]);
      }
    } catch (_) {}
  };

  const deleteHistorySession = async (sessionId) => {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      const sessions = raw ? JSON.parse(raw) : [];
      const updated = sessions.filter((s) => s.sessionId !== sessionId);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setHistoryData(updated);
    } catch (_) {}
  };

  // ─── History panel ──────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <View style={vc.root}>
        <View style={vc.historyHeader}>
          <TouchableOpacity onPress={() => setShowHistory(false)} style={vc.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
            <Text style={vc.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={vc.historyTitle}>Voice History</Text>
          <View style={{ width: 60 }} />
        </View>

        {historyData.length === 0 ? (
          <View style={vc.empty}>
            <Ionicons name="time-outline" size={48} color={colors.textMuted} />
            <Text style={vc.emptyTitle}>No history yet</Text>
            <Text style={vc.emptySub}>Sessions will appear here after you cook with Cooking Buddy.</Text>
          </View>
        ) : (
          [...historyData].reverse().map((session) => (
            <View key={session.sessionId} style={vc.historySession}>
              <View style={vc.historySessionHead}>
                <View style={{ flex: 1 }}>
                  <Text style={vc.historySessionDate}>{session.date}</Text>
                  <Text style={vc.historySessionMeta}>{session.startTime} · {session.entries.length} item{session.entries.length !== 1 ? 's' : ''}</Text>
                </View>
                {session.calorieResult != null && (
                  <Text style={vc.historyCalories}>{session.calorieResult} cal</Text>
                )}
                <TouchableOpacity onPress={() => deleteHistorySession(session.sessionId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {session.entries.map((entry) => (
                <View key={entry.id} style={vc.historyEntry}>
                  <View style={vc.historyEntryBody}>
                    <Text style={vc.historyEntryText}>{entry.text}</Text>
                    <Text style={vc.historyEntryTime}>{entry.timestamp}</Text>
                  </View>
                  <TouchableOpacity onPress={() => deleteHistoryEntry(session.sessionId, entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        )}
      </View>
    );
  }

  // ─── Main session view ──────────────────────────────────────────────────────
  return (
    <View style={vc.root}>
      {!supported && (
        <View style={vc.warnCard}>
          <Ionicons name="alert-circle-outline" size={18} color="#FF9500" />
          <Text style={vc.warnText}>Speech recognition requires Chrome or Edge on desktop.</Text>
        </View>
      )}

      <View style={vc.topRow}>
        <Text style={vc.wakeHint} numberOfLines={1}>
          {sessionActive ? 'Say "cooking buddy, [food]" to log' : 'Start a session to begin'}
        </Text>
        <TouchableOpacity onPress={() => { loadHistory(); setShowHistory(true); }} style={vc.historyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="time-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={vc.sessionRow}>
        {!sessionActive ? (
          <TouchableOpacity style={[vc.startBtn, !supported && { opacity: 0.4 }]} onPress={startSession} disabled={!supported} activeOpacity={0.8}>
            <Ionicons name="mic" size={20} color={colors.white} />
            <Text style={vc.startBtnText}>Start Session</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={vc.endBtn} onPress={endSession} activeOpacity={0.8}>
            <Ionicons name="stop-circle-outline" size={20} color={colors.red} />
            <Text style={vc.endBtnText}>End Session</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessionActive && (
        <View style={vc.liveCard}>
          {reconnecting ? (
            <View style={vc.liveIndicator}>
              <ActivityIndicator size="small" color={colors.textMuted} />
              <Text style={vc.reconnectText}>Reconnecting…</Text>
            </View>
          ) : (
            <View style={vc.liveIndicator}>
              <View style={vc.liveDot} />
              <Text style={vc.liveLabel}>LISTENING</Text>
            </View>
          )}
          <Text style={liveText ? vc.liveText : vc.liveMuted}>
            {liveText || 'Waiting for "cooking buddy"…'}
          </Text>
        </View>
      )}

      {entries.length > 0 && (
        <View style={vc.list}>
          <Text style={vc.listTitle}>Session ({entries.length} item{entries.length !== 1 ? 's' : ''})</Text>
          {entries.map((r, i) => (
            <View key={r.id} style={vc.card}>
              <View style={vc.idx}><Text style={vc.idxText}>{i + 1}</Text></View>
              <View style={vc.cardBody}>
                <Text style={vc.cardText}>{r.text}</Text>
                <Text style={vc.cardTime}>{r.timestamp}</Text>
              </View>
              <TouchableOpacity onPress={() => { setEntries((p) => p.filter((x) => x.id !== r.id)); setCalorieResult(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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

      {entries.length > 0 && (
        <View style={vc.analyzeSection}>
          {calorieResult == null ? (
            <TouchableOpacity style={[vc.analyzeBtn, loading && { opacity: 0.5 }]} onPress={analyzeCalories} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name="sparkles-outline" size={18} color={colors.white} />}
              <Text style={vc.analyzeBtnText}>{loading ? 'Calculating...' : 'Analyze Meal Calories'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={vc.resultCard}>
              <Text style={vc.resultLabel}>TOTAL CALORIES</Text>
              <Text style={vc.resultNumber}>{calorieResult}</Text>
              <Text style={vc.resultUnit}>estimated calories for this meal</Text>
              <TouchableOpacity style={vc.reBtn} onPress={() => setCalorieResult(null)}>
                <Text style={vc.reBtnText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {!sessionActive && entries.length === 0 && supported && (
        <View style={vc.empty}>
          <Ionicons name="mic-outline" size={48} color={colors.textMuted} />
          <Text style={vc.emptyTitle}>Cooking Buddy</Text>
          <Text style={vc.emptySub}>{'Start a session, then say:\n"cooking buddy, 100g chicken"\n"hey cooking buddy, cup of rice"'}</Text>
        </View>
      )}
    </View>
  );
}

const vc = StyleSheet.create({
  root: { gap: 12 },
  warnCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: '#FFF8EE', borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: '#FF9500' },
  warnText: { flex: 1, color: '#7A4800', fontSize: 14, lineHeight: 20 },
  // Top row
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  wakeHint: { flex: 1, fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  historyBtn: { padding: 4 },
  // Session buttons
  sessionRow: { paddingHorizontal: 16 },
  startBtn: { backgroundColor: colors.text, borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  startBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  endBtn: { backgroundColor: '#FFF0EE', borderWidth: 1.5, borderColor: colors.red, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  endBtnText: { fontSize: 16, fontWeight: '600', color: colors.red },
  // Live card
  liveCard: { marginHorizontal: 16, backgroundColor: '#F4F4F4', borderRadius: 16, padding: 16, gap: 8 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red },
  liveLabel: { fontSize: 11, fontWeight: '700', color: colors.red, letterSpacing: 0.8 },
  reconnectText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  liveText: { fontSize: 16, color: colors.text, lineHeight: 24 },
  liveMuted: { fontSize: 15, color: colors.textMuted, fontStyle: 'italic', lineHeight: 24 },
  // Entry list
  list: { paddingHorizontal: 16, gap: 8 },
  listTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.4 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: 14, padding: 14, gap: 12, borderWidth: 1, borderColor: colors.border },
  idx: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  idxText: { fontSize: 13, fontWeight: '700', color: colors.white },
  cardBody: { flex: 1, gap: 4 },
  cardText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  cardTime: { fontSize: 12, color: colors.textMuted },
  // Error
  errorCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 14, padding: 16, borderLeftWidth: 3, borderLeftColor: colors.red },
  errorText: { flex: 1, color: colors.red, fontSize: 14, lineHeight: 20 },
  // Analyze
  analyzeSection: { paddingHorizontal: 16 },
  analyzeBtn: { backgroundColor: colors.text, borderRadius: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  analyzeBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  resultCard: { backgroundColor: colors.card, borderRadius: 20, padding: 28, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border },
  resultLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1.2 },
  resultNumber: { fontSize: 72, fontWeight: '800', color: colors.text, letterSpacing: -2, lineHeight: 80 },
  resultUnit: { fontSize: 14, color: colors.textSecondary },
  reBtn: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 20 },
  reBtnText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  // Empty state
  empty: { alignItems: 'center', paddingHorizontal: 48, paddingTop: 16, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  // History panel
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 60 },
  backBtnText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  historyTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  historySession: { marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  historySessionHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historySessionDate: { fontSize: 15, fontWeight: '600', color: colors.text },
  historySessionMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  historyCalories: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginRight: 8 },
  historyEntry: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  historyEntryBody: { flex: 1 },
  historyEntryText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  historyEntryTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
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
