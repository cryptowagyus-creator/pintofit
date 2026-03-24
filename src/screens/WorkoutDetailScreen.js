import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function WorkoutDetailScreen({ route, navigation }) {
  const { day } = route.params;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>{day.name}</Text>
          <Text style={styles.sub}>
            {day.groups.reduce((s, g) => s + g.exercises.length, 0)} exercises
          </Text>
        </View>

        {/* Groups */}
        {day.groups.map((group) => (
          <View key={group.id} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.name.toUpperCase()}</Text>
            <View style={styles.listCard}>
              {group.exercises.map((ex, idx) => {
                const isLast = idx === group.exercises.length - 1;
                return (
                  <View key={ex.id}>
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => navigation.navigate('ExerciseDetail', { exercise: ex, group, day })}
                      activeOpacity={0.6}
                    >
                      <View style={styles.indexBox}>
                        <Text style={styles.indexText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.rowContent}>
                        <Text style={styles.rowTitle}>{ex.name}</Text>
                        <Text style={styles.rowSub}>{ex.sets}</Text>
                      </View>
                      <View style={styles.rowRight}>
                        {ex.video && (
                          <Ionicons name="play-circle-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                        )}
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                      </View>
                    </TouchableOpacity>
                    {!isLast && <View style={styles.rowSeparator} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 48 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 2,
  },
  backText: { fontSize: 17, color: colors.accent },

  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },

  section: { marginBottom: 28 },
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
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  indexBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  rowSub: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  rowSeparator: { height: 1, backgroundColor: colors.separator, marginLeft: 58 },
});
