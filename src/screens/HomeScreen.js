import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { workoutProgram } from '../data/workouts';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Weekly schedule: null = rest day, otherwise workout day id
const SCHEDULE = {
  0: null,               // Sun — rest
  1: null,               // Mon — rest
  2: 'chest_triceps',    // Tue — Day A
  3: 'back_biceps',      // Wed — Day B
  4: 'legs_shoulders',   // Thu — Day C
  5: 'chest_triceps',    // Fri — Day A
  6: 'back_biceps',      // Sat — Day B
};

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

  const days = workoutProgram.days;
  const selectedDayId = SCHEDULE[selectedDay];
  const selectedDayWorkout = selectedDayId
    ? days.find((d) => d.id === selectedDayId)
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
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.greetingName}>Pintico</Text>
        </View>

        {/* Week Strip */}
        <View style={styles.weekStrip}>
          {DAY_LABELS.map((label, i) => {
            const isSelected = i === selectedDay;
            const isToday = i === todayIndex;
            const hasWorkout = !!SCHEDULE[i];
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
                {/* Dot indicator: workout day */}
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
                <Ionicons name="chevron-forward" size={16} color="rgba(0,0,0,0.3)" />
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
            <View style={styles.restCard}>
              <Text style={styles.restEmoji}>🛌</Text>
              <View>
                <Text style={styles.restTitle}>
                  {selectedDay === todayIndex ? 'Rest Day' : `${DAY_LABELS[selectedDay]} — Rest`}
                </Text>
                <Text style={styles.restSub}>Recovery is part of the program.</Text>
              </View>
            </View>
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
  greeting: { fontSize: 15, color: colors.textSecondary, fontWeight: '400' },
  greetingName: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginTop: 2 },

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
  focusCard: {
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
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
  restEmoji: { fontSize: 32 },
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
});
