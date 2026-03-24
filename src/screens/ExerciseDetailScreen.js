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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
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
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={styles.backText}>{day ? day.name : group.name}</Text>
        </TouchableOpacity>

        {/* Video or Placeholder */}
        {exercise.video ? (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={exercise.video}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) setIsPlaying(status.isPlaying);
              }}
            />
            <TouchableOpacity style={styles.playOverlay} onPress={handlePlayPause}>
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={64}
                color="rgba(255,255,255,0.9)"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <LinearGradient
              colors={[group.color + '22', '#0a0a0a']}
              style={styles.placeholderGradient}
            >
              <Ionicons name="videocam-outline" size={48} color={group.color} />
              <Text style={[styles.placeholderText, { color: group.color }]}>Video Coming Soon</Text>
              <Text style={styles.placeholderSub}>Drop the video file in assets/videos/</Text>
              <Text style={[styles.placeholderCode, { color: group.color + 'aa' }]}>
                {exercise.id}.mp4
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Exercise Info */}
        <View style={styles.content}>

          {/* Title */}
          <View style={styles.titleRow}>
            <View style={[styles.colorDot, { backgroundColor: group.color }]} />
            <Text style={[styles.groupTag, { color: group.color }]}>{group.name.toUpperCase()}</Text>
          </View>
          <Text style={styles.exName}>{exercise.name}</Text>

          {/* Sets Badge */}
          <View style={[styles.setsBadge, { borderColor: group.color + '55' }]}>
            <Ionicons name="repeat-outline" size={18} color={group.color} />
            <Text style={[styles.setsText, { color: group.color }]}>{exercise.sets}</Text>
          </View>

          {/* Quick Tip */}
          {exercise.tip && (
            <View style={[styles.tipCard, { borderLeftColor: group.color }]}>
              <View style={styles.tipHeader}>
                <Ionicons name="flash" size={16} color={group.color} />
                <Text style={[styles.tipLabel, { color: group.color }]}>QUICK TIP</Text>
              </View>
              <Text style={styles.tipBody}>{exercise.tip}</Text>
            </View>
          )}

          {/* Explanation */}
          <View style={styles.explanationSection}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="book-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitleText}>HOW TO DO IT</Text>
            </View>
            <Text style={styles.explanationText}>{exercise.explanation}</Text>
          </View>

        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: colors.text, fontWeight: '600', fontSize: 15 },

  videoWrapper: {
    width: width,
    height: width * 0.56,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  videoPlaceholder: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderGradient: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { fontSize: 18, fontWeight: '700' },
  placeholderSub: { fontSize: 12, color: colors.textMuted },
  placeholderCode: { fontSize: 12, fontFamily: 'monospace', marginTop: 4 },

  content: { paddingHorizontal: 20, paddingTop: 24, gap: 18 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  groupTag: { fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  exName: { fontSize: 28, fontWeight: '900', color: colors.text, lineHeight: 34 },

  setsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  setsText: { fontSize: 15, fontWeight: '700' },

  tipCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  tipBody: { color: colors.text, fontSize: 15, lineHeight: 22 },

  explanationSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleText: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: colors.textSecondary },
  explanationText: { color: colors.text, fontSize: 16, lineHeight: 26 },
});
