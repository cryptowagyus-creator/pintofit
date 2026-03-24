import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { workoutProgram } from '../data/workouts';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cardMeta = {
  chest_triceps: {
    bg: colors.yellowCard,
    tag: 'Push',
    tagColor: '#B8860B',
  },
  back_biceps: {
    bg: colors.blueCard,
    tag: 'Pull',
    tagColor: colors.blue,
  },
  legs_shoulders: {
    bg: colors.lavenderCard,
    tag: 'Legs',
    tagColor: colors.lavender,
  },
};

export default function HomeScreen() {
  const navigation = useNavigation();
  const todayIndex = new Date().getDay();

  const days = workoutProgram.days;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.greetingName}>Pintico</Text>
        </View>

        {/* Week Day Strip */}
        <View style={styles.weekStrip}>
          {DAY_LABELS.map((label, i) => {
            const isToday = i === todayIndex;
            return (
              <View key={label} style={styles.dayItem}>
                <View style={[styles.dayCircle, isToday && styles.dayCircleActive]}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                    {label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Your Plan</Text>

        {/* Cards — first card full width tall, then two side by side */}
        <View style={styles.cardsContainer}>
          {/* First card — full width */}
          {days[0] && (
            <WorkoutCard
              day={days[0]}
              meta={cardMeta[days[0].id]}
              tall
              onPress={() => navigation.navigate('WorkoutDetail', { day: days[0] })}
            />
          )}

          {/* Remaining two cards side by side */}
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
      style={[
        styles.card,
        { backgroundColor: meta.bg },
        tall && styles.cardTall,
        half && styles.cardHalf,
      ]}
    >
      {/* Label pill */}
      <View style={[styles.dayLabelPill, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
        <Text style={[styles.dayLabelPillText, { color: meta.tagColor }]}>{day.label}</Text>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.cardName} numberOfLines={2}>{day.name}</Text>

        <View style={styles.cardMeta}>
          {/* Tag */}
          <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
            <Text style={[styles.tagText, { color: meta.tagColor }]}>{meta.tag}</Text>
          </View>
          {/* Exercise count */}
          <Text style={styles.exCount}>{totalEx} exercises</Text>
        </View>
      </View>

      {/* Chevron */}
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

  greetingBlock: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  dayItem: { alignItems: 'center' },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.text,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  dayLabelActive: {
    color: colors.white,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: 24,
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  rowCards: {
    flexDirection: 'row',
    gap: 12,
  },

  card: {
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  cardTall: {
    height: 220,
    justifyContent: 'space-between',
  },
  cardHalf: {
    flex: 1,
    height: 160,
    justifyContent: 'space-between',
  },

  dayLabelPill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  dayLabelPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  cardBottom: {
    gap: 10,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagPill: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  exCount: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '500',
  },

  chevronWrapper: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
});
