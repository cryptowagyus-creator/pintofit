import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { t } from '../utils/i18n';

const { width } = Dimensions.get('window');

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exercise, group, day, currentUser } = route.params;
  const videoRef = useRef(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={colors.blue} />
          <Text style={styles.backText}>{day ? day.name : group.name}</Text>
        </TouchableOpacity>

        {/* Video — native controls, iOS takes over with its own player */}
        {exercise.video ? (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={exercise.video}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls={false}
              shouldPlay={false}
              isLooping={false}
            />
            <TouchableOpacity
              style={styles.videoTap}
              activeOpacity={0.7}
              onPress={async () => {
                await videoRef.current?.playAsync();
                videoRef.current?.presentFullscreenPlayer();
              }}
            >
              <View style={styles.playBtn}>
                <Ionicons name="play" size={28} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam-off-outline" size={28} color={colors.textMuted} />
            <Text style={styles.placeholderText}>{t(currentUser, 'No video available', 'No hay video disponible')}</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.groupLabel}>{group.name.toUpperCase()}</Text>
          <Text style={styles.title}>{exercise.name}</Text>

          <View style={styles.setsPill}>
            <Ionicons name="repeat-outline" size={14} color={colors.blue} />
            <Text style={styles.setsText}>{exercise.sets}</Text>
          </View>

          {exercise.tip && (
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>{t(currentUser, 'TIP', 'TIP')}</Text>
              <Text style={styles.tipText}>{exercise.tip}</Text>
            </View>
          )}

          <Text style={styles.howLabel}>{t(currentUser, 'HOW TO DO IT', 'COMO HACERLO')}</Text>
          <Text style={styles.explanation}>{exercise.explanation}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: 48 },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 2,
  },
  backText: { fontSize: 17, color: colors.blue },

  videoWrapper: {
    width: width,
    height: 260,
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },
  videoTap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },

  videoPlaceholder: {
    width: width,
    height: 160,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: colors.textMuted, fontSize: 14 },

  info: { paddingHorizontal: 24, paddingTop: 28, gap: 16 },
  groupLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginTop: -4 },

  setsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  setsText: { fontSize: 14, fontWeight: '500', color: colors.text },

  tipCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.blue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  tipLabel: { fontSize: 11, fontWeight: '600', color: colors.blue, letterSpacing: 0.8 },
  tipText: { fontSize: 15, color: colors.text, lineHeight: 22 },

  howLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: -4 },
  explanation: { fontSize: 16, color: colors.textSecondary, lineHeight: 26 },
});
