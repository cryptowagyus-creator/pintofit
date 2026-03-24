import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { workoutProgram } from '../data/workouts';

export default function HomeScreen({ navigation }) {
  const totalExercises = workoutProgram.days.reduce(
    (sum, day) => sum + day.groups.reduce((s, g) => s + g.exercises.length, 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={['#1a0a0a', '#0a0a0a']} style={styles.hero}>
          <Text style={styles.appName}>PINTO<Text style={styles.appNameAccent}>FIT</Text></Text>
          <View style={styles.heroRow}>
            <View style={styles.athleteBadge}>
              <Text style={styles.athleteEmoji}>🏆</Text>
              <View>
                <Text style={styles.athleteLabel}>ATHLETE</Text>
                <Text style={styles.athleteName}>{workoutProgram.athlete}</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{workoutProgram.days.length}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{totalExercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>WORKOUT SPLIT</Text>
        </View>

        {/* Day Cards */}
        {workoutProgram.days.map((day) => {
          const totalEx = day.groups.reduce((s, g) => s + g.exercises.length, 0);
          return (
            <TouchableOpacity
              key={day.id}
              style={styles.dayCard}
              onPress={() => navigation.navigate('WorkoutDetail', { day })}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={[day.colors[0] + '44', day.colors[1] + '22', colors.card]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dayGradient}
              >
                {/* Label pill */}
                <View style={[styles.labelPill, { borderColor: day.colors[0] }]}>
                  <Text style={[styles.labelText, { color: day.colors[0] }]}>{day.label}</Text>
                </View>

                <View style={styles.dayMiddle}>
                  <Text style={styles.dayEmoji}>{day.emoji}</Text>
                  <Text style={styles.dayName}>{day.name}</Text>

                  {/* Muscle chips */}
                  <View style={styles.chips}>
                    {day.groups.map((g) => (
                      <View key={g.id} style={[styles.chip, { backgroundColor: g.color + '22', borderColor: g.color + '66' }]}>
                        <Text style={[styles.chipText, { color: g.color }]}>{g.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.dayRight}>
                  <Text style={[styles.exCount, { color: day.colors[0] }]}>{totalEx}</Text>
                  <Text style={styles.exLabel}>exercises</Text>
                  <Ionicons name="chevron-forward" size={20} color={day.colors[0]} style={{ marginTop: 8 }} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Built for the Pinto Family 🏠</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  hero: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 28 },
  appName: { fontSize: 42, fontWeight: '900', color: colors.text, letterSpacing: 4, marginBottom: 20 },
  appNameAccent: { color: colors.accent },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  athleteBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  athleteEmoji: { fontSize: 26 },
  athleteLabel: { fontSize: 10, color: colors.textMuted, letterSpacing: 2 },
  athleteName: { fontSize: 20, fontWeight: '800', color: colors.text },
  statBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNum: { fontSize: 24, fontWeight: '900', color: colors.accent },
  statLabel: { fontSize: 10, color: colors.textSecondary, letterSpacing: 1 },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12 },
  sectionTitle: { fontSize: 12, letterSpacing: 3, color: colors.textMuted, fontWeight: '700' },

  dayCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 18, overflow: 'hidden' },
  dayGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    gap: 14,
  },

  labelPill: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  labelText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  dayMiddle: { flex: 1, gap: 6 },
  dayEmoji: { fontSize: 28 },
  dayName: { fontSize: 20, fontWeight: '900', color: colors.text },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: { fontSize: 12, fontWeight: '700' },

  dayRight: { alignItems: 'center' },
  exCount: { fontSize: 30, fontWeight: '900' },
  exLabel: { fontSize: 11, color: colors.textSecondary },

  footer: { alignItems: 'center', paddingVertical: 30 },
  footerText: { color: colors.textMuted, fontSize: 13 },
});
