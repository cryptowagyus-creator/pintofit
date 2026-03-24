import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exercise, group, day } = route.params;
  const [fullscreen, setFullscreen] = useState(false);
  const inlineRef = useRef(null);
  const fullscreenRef = useRef(null);

  const openFullscreen = async () => {
    if (inlineRef.current) await inlineRef.current.pauseAsync();
    setFullscreen(true);
    setTimeout(async () => {
      if (fullscreenRef.current) await fullscreenRef.current.playAsync();
    }, 300);
  };

  const closeFullscreen = async () => {
    if (fullscreenRef.current) await fullscreenRef.current.pauseAsync();
    setFullscreen(false);
  };

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

        {/* Inline Video */}
        {exercise.video ? (
          <TouchableOpacity style={styles.videoWrapper} onPress={openFullscreen} activeOpacity={0.9}>
            <Video
              ref={inlineRef}
              source={exercise.video}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={false}
              isLooping
              isMuted
            />
            <View style={styles.videoOverlay}>
              <View style={styles.playBtn}>
                <Ionicons name="play" size={20} color="#fff" />
              </View>
              <View style={styles.expandHint}>
                <Ionicons name="expand-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.expandText}>Tap for fullscreen</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="videocam-off-outline" size={28} color={colors.textMuted} />
            <Text style={styles.placeholderText}>No video available</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.groupLabel}>{group.name.toUpperCase()}</Text>
          <Text style={styles.title}>{exercise.name}</Text>

          <View style={styles.setsPill}>
            <Ionicons name="repeat-outline" size={14} color={colors.accent} />
            <Text style={styles.setsText}>{exercise.sets}</Text>
          </View>

          {exercise.tip && (
            <View style={styles.tipCard}>
              <Text style={styles.tipLabel}>TIP</Text>
              <Text style={styles.tipText}>{exercise.tip}</Text>
            </View>
          )}

          <Text style={styles.howLabel}>HOW TO DO IT</Text>
          <Text style={styles.explanation}>{exercise.explanation}</Text>
        </View>
      </ScrollView>

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreen}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeFullscreen}
      >
        <View style={styles.fsContainer}>
          <Video
            ref={fullscreenRef}
            source={exercise.video}
            style={styles.fsVideo}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            useNativeControls={Platform.OS !== 'web'}
          />
          <TouchableOpacity style={styles.fsClose} onPress={closeFullscreen}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
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
    height: width * (16 / 9),
    backgroundColor: '#000',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  expandHint: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

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
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
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
  tipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.blue,
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
  explanation: { fontSize: 16, color: colors.textSecondary, lineHeight: 26 },

  // Fullscreen modal
  fsContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsVideo: {
    width: '100%',
    height: '100%',
  },
  fsClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
