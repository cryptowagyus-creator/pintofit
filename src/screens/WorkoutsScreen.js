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

const cardMeta = {
  chest_triceps: {
    bg: colors.yellowCard,
    tag: 'Push',
    tagColor: colors.green,
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

export default function WorkoutsScreen() {
  const navigation = useNavigation();
  const days = workoutProgram.days;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Workouts</Text>
          <Text style={styles.subtitle}>Pintico's Program</Text>
        </View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {days.map((day) => {
            const meta = cardMeta[day.id];
            const totalEx = day.groups.reduce((s, g) => s + g.exercises.length, 0);
            return (
              <TouchableOpacity
                key={day.id}
                onPress={() => navigation.navigate('WorkoutDetail', { day })}
                activeOpacity={0.85}
                style={[styles.card, { backgroundColor: meta.bg }]}
              >
                {/* Day label pill */}
                <View style={[styles.labelPill, { backgroundColor: 'rgba(255,255,255,0.5)' }]}>
                  <Text style={[styles.labelPillText, { color: meta.tagColor }]}>{day.label}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{day.name}</Text>

                  <View style={styles.cardMeta}>
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                      <Text style={[styles.tagText, { color: meta.tagColor }]}>{meta.tag}</Text>
                    </View>
                    <Text style={styles.exCount}>{totalEx} exercises</Text>
                  </View>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="rgba(0,0,0,0.35)"
                  style={styles.chevron}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 120 },

  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },

  cardsContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },

  card: {
    borderRadius: 20,
    padding: 20,
    height: 160,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },

  labelPill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  labelPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  cardBody: {
    gap: 10,
  },
  cardName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
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

  chevron: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});
