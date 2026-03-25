import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { workoutProgram } from '../data/workouts';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STORAGE_KEY = 'pintofit_logged_workouts';
const AVATAR_KEY = 'pintofit_avatar_uri';

const cardMeta = {
  chest_triceps:  { bg: colors.yellowCard,   tag: 'Push', tagColor: '#B8860B' },
  back_biceps:    { bg: colors.blueCard,     tag: 'Pull', tagColor: colors.blue },
  legs_shoulders: { bg: colors.lavenderCard, tag: 'Legs', tagColor: colors.lavender },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const todayIndex = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(todayIndex);
  const [loggedWorkouts, setLoggedWorkouts] = useState({});
  const [pickerVisible, setPickerVisible] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  const days = workoutProgram.days;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setLoggedWorkouts(JSON.parse(raw));
    });
    AsyncStorage.getItem(AVATAR_KEY).then((uri) => {
      if (uri) setAvatarUri(uri);
    });
  }, []);

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      await AsyncStorage.setItem(AVATAR_KEY, uri);
    }
  }

  async function logWorkout(dayIndex, workoutId) {
    const updated = { ...loggedWorkouts, [dayIndex]: workoutId };
    setLoggedWorkouts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPickerVisible(false);
  }

  async function clearWorkout(dayIndex) {
    const updated = { ...loggedWorkouts };
    delete updated[dayIndex];
    setLoggedWorkouts(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPickerVisible(false);
  }

  const selectedDayWorkoutId = loggedWorkouts[selectedDay];
  const selectedDayWorkout = selectedDayWorkoutId
    ? days.find((d) => d.id === selectedDayWorkoutId)
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.greetingName}>Pintico</Text>
            </View>
            <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarWrapper}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color="#fff" />
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={11} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Week Strip */}
        <View style={styles.weekStrip}>
          {DAY_LABELS.map((label, i) => {
            const isSelected = i === selectedDay;
            const isToday = i === todayIndex;
            const hasWorkout = !!loggedWorkouts[i];
            return (
              <TouchableOpacity
                key={label}
                style={styles.dayItem}
                onPress={() => setSelectedDay(i)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayCircle, isSelected && styles.dayCircleActive]}>
                  <Text style={[styles.dayNum, isSelected && styles.dayNumActive]}>
                    {label}
                  </Text>
                </View>
                <View style={[
                  styles.dot,
                  hasWorkout ? styles.dotWorkout : styles.dotRest,
                  isSelected && hasWorkout && styles.dotSelected,
                ]} />
                {isToday && !isSelected && <View style={styles.todayTick} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Day Focus Card */}
        <View style={styles.focusWrapper}>
          {selectedDayWorkout ? (
            <TouchableOpacity
              style={[styles.focusCard, { backgroundColor: cardMeta[selectedDayWorkout.id].bg }]}
              onPress={() => navigation.navigate('WorkoutDetail', { day: selectedDayWorkout })}
              activeOpacity={0.85}
            >
              <View style={styles.focusTop}>
                <View style={[styles.focusPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                  <Text style={[styles.focusPillText, { color: cardMeta[selectedDayWorkout.id].tagColor }]}>
                    {selectedDay === todayIndex ? "Today's Workout" : DAY_LABELS[selectedDay]}
                    {' · '}{selectedDayWorkout.label}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPickerVisible(true)} hitSlop={8}>
                  <Ionicons name="create-outline" size={18} color="rgba(0,0,0,0.35)" />
                </TouchableOpacity>
              </View>
              <Text style={styles.focusName}>{selectedDayWorkout.name}</Text>
              <View style={styles.focusMeta}>
                <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                  <Text style={[styles.tagText, { color: cardMeta[selectedDayWorkout.id].tagColor }]}>
                    {cardMeta[selectedDayWorkout.id].tag}
                  </Text>
                </View>
                <Text style={styles.focusExCount}>
                  {selectedDayWorkout.groups.reduce((s, g) => s + g.exercises.length, 0)} exercises
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.restCard}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={32} color={colors.blue} />
              <View>
                <Text style={styles.restTitle}>
                  {selectedDay === todayIndex ? 'Log Today\'s Workout' : `Log ${DAY_LABELS[selectedDay]}'s Workout`}
                </Text>
                <Text style={styles.restSub}>Tap to choose Day A, B or C</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Full Plan */}
        <Text style={styles.sectionTitle}>Your Plan</Text>
        <View style={styles.cardsContainer}>
          {days[0] && (
            <WorkoutCard
              day={days[0]}
              meta={cardMeta[days[0].id]}
              tall
              onPress={() => navigation.navigate('WorkoutDetail', { day: days[0] })}
            />
          )}
          {(days[1] || days[2]) && (
            <View style={styles.rowCards}>
              {days[1] && (
                <WorkoutCard
                  day={days[1]}
                  meta={cardMeta[days[1].id]}
                  half
                  onPress={() => navigation.navigate('WorkoutDetail', { day: days[1] })}
                />
              )}
              {days[2] && (
                <WorkoutCard
                  day={days[2]}
                  meta={cardMeta[days[2].id]}
                  half
                  onPress={() => navigation.navigate('WorkoutDetail', { day: days[2] })}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Workout Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedDay === todayIndex ? "Log Today's Workout" : `Log ${DAY_LABELS[selectedDay]}'s Workout`}
            </Text>
            {days.map((day) => (
              <TouchableOpacity
                key={day.id}
                style={[styles.pickerRow, { backgroundColor: cardMeta[day.id].bg }]}
                onPress={() => logWorkout(selectedDay, day.id)}
                activeOpacity={0.85}
              >
                <View>
                  <Text style={styles.pickerLabel}>{day.label}</Text>
                  <Text style={styles.pickerName}>{day.name}</Text>
                </View>
                <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                  <Text style={[styles.tagText, { color: cardMeta[day.id].tagColor }]}>
                    {cardMeta[day.id].tag}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {loggedWorkouts[selectedDay] && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => clearWorkout(selectedDay)}
              >
                <Text style={styles.clearText}>Clear this day</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function WorkoutCard({ day, meta, tall, half, onPress }) {
  const totalEx = day.groups.reduce((s, g) => s + g.exercises.length, 0);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: meta.bg }, tall && styles.cardTall, half && styles.cardHalf]}
    >
      <View style={[styles.dayLabelPill, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
        <Text style={[styles.dayLabelPillText, { color: meta.tagColor }]}>{day.label}</Text>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={2}>{day.name}</Text>
        <View style={styles.cardMeta}>
          <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
            <Text style={[styles.tagText, { color: meta.tagColor }]}>{meta.tag}</Text>
          </View>
          <Text style={styles.exCount}>{totalEx} exercises</Text>
        </View>
      </View>
      <View style={styles.chevronWrapper}>
        <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.35)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 120 },

  logoBlock: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  logo: { width: 120, height: 120 },

  greetingBlock: { paddingHorizontal: 24, paddingBottom: 20 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '400' },
  greetingName: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginTop: 2 },
  avatarWrapper: { position: 'relative', width: 56, height: 56 },
  avatarImg: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.blue },
  avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.text,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },

  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  dayItem: { alignItems: 'center', gap: 4 },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: { backgroundColor: colors.text },
  dayNum: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  dayNumActive: { color: colors.white, fontWeight: '700' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotWorkout: { backgroundColor: colors.textMuted },
  dotRest: { backgroundColor: 'transparent' },
  dotSelected: { backgroundColor: colors.text },
  todayTick: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.blue,
  },

  focusWrapper: { paddingHorizontal: 16, marginBottom: 28 },
  focusCard: { borderRadius: 20, padding: 20, gap: 10 },
  focusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusPill: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  focusPillText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  focusName: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  focusMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  focusExCount: { fontSize: 13, color: 'rgba(0,0,0,0.45)', fontWeight: '500' },

  restCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  restTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  restSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text, paddingHorizontal: 24, marginBottom: 14, letterSpacing: -0.3 },

  cardsContainer: { paddingHorizontal: 16, gap: 12 },
  rowCards: { flexDirection: 'row', gap: 12 },

  card: { borderRadius: 20, padding: 18, position: 'relative', overflow: 'hidden' },
  cardTall: { height: 200, justifyContent: 'space-between' },
  cardHalf: { flex: 1, height: 150, justifyContent: 'space-between' },

  dayLabelPill: { alignSelf: 'flex-start', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 8 },
  dayLabelPillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  cardBottom: { gap: 8 },
  cardName: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3, lineHeight: 22 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tagPill: { borderRadius: 8, paddingVertical: 3, paddingHorizontal: 9 },
  tagText: { fontSize: 12, fontWeight: '600' },
  exCount: { fontSize: 12, color: 'rgba(0,0,0,0.5)', fontWeight: '500' },
  chevronWrapper: { position: 'absolute', top: 18, right: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
  },
  pickerLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.4)', letterSpacing: 0.5, marginBottom: 2 },
  pickerName: { fontSize: 16, fontWeight: '700', color: colors.text },
  clearBtn: { alignItems: 'center', paddingTop: 8 },
  clearText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
});
