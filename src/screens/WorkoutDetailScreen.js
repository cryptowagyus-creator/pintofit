import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function WorkoutDetailScreen({ route, navigation }) {
  const { day } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient
          colors={[day.colors[0] + '55', day.colors[1] + '33', '#0a0a0a']}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.dayLabel}>{day.label}</Text>
          <Text style={styles.dayEmoji}>{day.emoji}</Text>
          <Text style={styles.dayName}>{day.name}</Text>
          <View style={styles.headerChips}>
            {day.groups.map((g) => (
              <View key={g.id} style={[styles.headerChip, { backgroundColor: g.color + '22', borderColor: g.color }]}>
                <Text style={[styles.headerChipText, { color: g.color }]}>{g.name} · {g.exercises.length} exercises</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Groups */}
        {day.groups.map((group, gIdx) => (
          <View key={group.id} style={styles.groupSection}>

            {/* Group Header */}
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: group.color }]} />
              <Text style={[styles.groupName, { color: group.color }]}>{group.name.toUpperCase()}</Text>
            </View>

            {/* Exercises */}
            {group.exercises.map((ex, idx) => (
              <TouchableOpacity
                key={ex.id}
                style={styles.exerciseCard}
                onPress={() => navigation.navigate('ExerciseDetail', { exercise: ex, group, day })}
                activeOpacity={0.75}
              >
                <View style={[styles.indexBadge, { backgroundColor: group.color }]}>
                  <Text style={styles.indexText}>{idx + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <View style={styles.exMeta}>
                    <Ionicons name="repeat" size={13} color={colors.textSecondary} />
                    <Text style={styles.exSets}>{ex.sets}</Text>
                  </View>
                  {ex.tip && (
                    <View style={styles.tipRow}>
                      <Ionicons name="flash" size={12} color={group.color} />
                      <Text style={[styles.tipText, { color: group.color }]}>{ex.tip}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.exRight}>
                  {ex.video ? (
                    <View style={styles.videoBadge}>
                      <Ionicons name="play-circle" size={18} color={group.color} />
                      <Text style={[styles.videoBadgeText, { color: group.color }]}>Video</Text>
                    </View>
                  ) : (
                    <Ionicons name="videocam-off-outline" size={16} color={colors.textMuted} style={{ opacity: 0.5 }} />
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginTop: 6 }} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Divider between groups */}
            {gIdx < day.groups.length - 1 && <View style={styles.divider} />}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  header: { paddingTop: 20, paddingBottom: 30, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayLabel: { fontSize: 11, letterSpacing: 3, color: colors.textMuted, fontWeight: '700', marginBottom: 6 },
  dayEmoji: { fontSize: 42, marginBottom: 6 },
  dayName: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: 1, textAlign: 'center' },
  headerChips: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  headerChip: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerChipText: { fontSize: 13, fontWeight: '700' },

  groupSection: { paddingHorizontal: 16, paddingTop: 8 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 8 },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupName: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  indexBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  indexText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  exInfo: { flex: 1, gap: 4 },
  exName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  exSets: { fontSize: 13, color: colors.textSecondary },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  tipText: { fontSize: 12, fontWeight: '600' },

  exRight: { alignItems: 'center', gap: 4 },
  videoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  videoBadgeText: { fontSize: 12, fontWeight: '600' },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
});
