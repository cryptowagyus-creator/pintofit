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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { workoutProgram } from '../data/workouts';

const dayMeta = {
  chest_triceps: { label: 'Push', icon: 'arrow-up-outline' },
  back_biceps:   { label: 'Pull', icon: 'arrow-down-outline' },
  legs_shoulders:{ label: 'Legs', icon: 'walk-outline' },
};

export default function HomeScreen({ navigation }) {
  const totalExercises = workoutProgram.days.reduce(
    (sum, day) => sum + day.groups.reduce((s, g) => s + g.exercises.length, 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>PintoFit</Text>
          <Text style={styles.appSub}>Pintico's Program</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{workoutProgram.days.length}</Text>
            <Text style={styles.statLabel}>Training Days</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalExercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>6</Text>
            <Text style={styles.statLabel}>Muscle Groups</Text>
          </View>
        </View>

        {/* Workout Split */}
        <Text style={styles.sectionLabel}>WORKOUT SPLIT</Text>
        <View style={styles.listCard}>
          {workoutProgram.days.map((day, idx) => {
            const meta = dayMeta[day.id];
            const totalEx = day.groups.reduce((s, g) => s + g.exercises.length, 0);
            const isLast = idx === workoutProgram.days.length - 1;
            return (
              <View key={day.id}>
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => navigation.navigate('WorkoutDetail', { day })}
                  activeOpacity={0.6}
                >
                  <View style={styles.rowIcon}>
                    <Ionicons name={meta.icon} size={18} color={colors.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>{day.name}</Text>
                    <Text style={styles.rowSub}>{totalEx} exercises · {meta.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
                {!isLast && <View style={styles.rowSeparator} />}
              </View>
            );
          })}
        </View>

        {/* Tools */}
        <Text style={styles.sectionLabel}>TOOLS</Text>
        <View style={styles.listCard}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('CalorieEstimator')}
            activeOpacity={0.6}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.green + '18' }]}>
              <Ionicons name="scan-outline" size={18} color={colors.green} />
            </View>
            <View style={styles.rowContent}>
              <Text style={styles.rowTitle}>Calorie Estimator</Text>
              <Text style={styles.rowSub}>AI-powered food analysis</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: 48 },

  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28 },
  appName: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  appSub: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statNum: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  statDivider: { width: 1, backgroundColor: colors.separator, marginVertical: 4 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginHorizontal: 24,
    marginBottom: 8,
  },

  listCard: {
    marginHorizontal: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 32,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  rowSeparator: { height: 1, backgroundColor: colors.separator, marginLeft: 66 },
});
