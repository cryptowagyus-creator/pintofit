import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FAMILY_AVATARS } from '../data/family';
import { buildLeaderboardRows, getWeeklyPoints } from '../utils/points';
import { t } from '../utils/i18n';

export default function LeaderboardScreen({ currentUser }) {
  const [rows, setRows] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getWeeklyPoints().then((state) => {
        if (active) setRows(buildLeaderboardRows(state.scores));
      });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{t(currentUser, 'Leaderboard', 'Clasificacion')}</Text>
          <Text style={styles.subtitle}>{t(currentUser, 'Weekly points reset Sundays at 10:00 PM.', 'Los puntos semanales se reinician los domingos a las 10:00 PM.')}</Text>
        </View>

        <View style={styles.list}>
          {rows.map((row, index) => {
            const avatarSource = FAMILY_AVATARS[row.userKey] || null;
            const isCurrentUser = row.name === currentUser;

            return (
              <View key={row.userKey} style={[styles.row, isCurrentUser && styles.currentRow]}>
                <Text style={styles.rank}>{index + 1}</Text>
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </View>
                )}
                <View style={styles.rowMain}>
                  <Text style={styles.name}>{row.name}</Text>
                  {isCurrentUser ? <Text style={styles.youTag}>{t(currentUser, 'You', 'Tu')}</Text> : null}
                </View>
                <View style={styles.pointsPill}>
                  <Ionicons name="trophy" size={14} color={colors.green} />
                  <Text style={styles.pointsText}>{row.points}</Text>
                </View>
              </View>
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
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 18 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  currentRow: { borderWidth: 1.5, borderColor: colors.green },
  rank: { width: 24, fontSize: 18, fontWeight: '800', color: colors.text },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.green },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMain: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  youTag: { marginTop: 2, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F8DE',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pointsText: { fontSize: 14, fontWeight: '800', color: colors.text },
});
