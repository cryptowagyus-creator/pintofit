import React, { useState, useRef } from 'react';
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

const { width } = Dimensions.get('window');

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exercise, group, day } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
          <Text style={styles.backText}>{day ? day.name : group.name}</Text>
        </TouchableOpacity>

        {/* Video */}
        {exercise.video ? (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={exercise.video}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              onPlaybackStatusUpdate={(s) => s.isLoaded && setIsPlaying(s.isPlaying)}
            />
            <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
              {!isPlaying && (
                <View style={styles.playBtn}>
                  <Ionicons name="play" size={22} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam-off-outline" size={28} color={colors.textTertiary} />
            <Text style={styles.placeholderText}>No video available</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.groupLabel}>{group.name.toUpperCase()}</Text>
          <Text style={styles.title}>{exercise.name}</Text>

          {/* Sets pill */}
          <View style={styles.setsPill}>
            <Ionicons name="repeat-outline" size={14} color={colors.accent} />
            <Text style={styles.setsText}>{exercise.sets}</Text>
          </View>

          {/* Tip */}
          {exercise.tip && (
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>TIP</Text>
              <Text style={styles.tipText}>{exercise.tip}</Text>
            </View>
          )}

          {/* How To */}
          <Text style={styles.howLabel}>HOW TO DO IT</Text>
          <Text style={styles.explanation}>{exercise.explanation}</Text>
        </View>

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

  videoWrapper: {
    width: width,
    height: width * 0.56,
    backgroundColor: '#000',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },

  videoPlaceholder: {
    width: width,
    height: 160,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: colors.textTertiary, fontSize: 14 },

  info: { paddingHorizontal: 24, paddingTop: 28, gap: 16 },

  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: -4,
  },

  setsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  setsText: { fontSize: 14, fontWeight: '500', color: colors.text },

  tipCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    gap: 6,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    letterSpacing: 0.8,
  },
  tipText: { fontSize: 15, color: colors.text, lineHeight: 22 },

  howLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: -4,
  },
  explanation: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 26,
  },
});
