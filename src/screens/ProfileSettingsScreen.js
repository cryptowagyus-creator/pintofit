import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FAMILY_AVATARS, getUserKey } from '../data/family';

export const CUSTOM_AVATAR_KEY_PREFIX = 'pintofit_custom_avatar_';

export default function ProfileSettingsScreen({ currentUser, onLogout }) {
  const userKey = getUserKey(currentUser);
  const defaultAvatar = FAMILY_AVATARS[userKey] || null;

  const [customAvatarUri, setCustomAvatarUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(`${CUSTOM_AVATAR_KEY_PREFIX}${userKey}`).then((uri) => {
      if (uri) setCustomAvatarUri(uri);
    });
  }, [userKey]);

  const pickNewPhoto = async () => {
    setSaveMsg(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setSaveMsg('Photo library permission is required.');
      return;
    }
    setUploading(true);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]) {
        const uri = res.assets[0].uri;
        await AsyncStorage.setItem(`${CUSTOM_AVATAR_KEY_PREFIX}${userKey}`, uri);
        setCustomAvatarUri(uri);
        setSaveMsg('Profile photo updated!');
      }
    } finally {
      setUploading(false);
    }
  };

  const removeCustomPhoto = async () => {
    await AsyncStorage.removeItem(`${CUSTOM_AVATAR_KEY_PREFIX}${userKey}`);
    setCustomAvatarUri(null);
    setSaveMsg('Reverted to default photo.');
  };

  const avatarSource = customAvatarUri ? { uri: customAvatarUri } : defaultAvatar;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {avatarSource ? (
              <Image source={avatarSource} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={52} color={colors.white} />
              </View>
            )}
            {uploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{currentUser}</Text>
          <Text style={styles.userSub}>Family member</Text>
        </View>

        {/* Photo actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROFILE PHOTO</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={pickNewPhoto} disabled={uploading} activeOpacity={0.7}>
              <View style={styles.rowIcon}>
                <Ionicons name="image-outline" size={20} color={colors.text} />
              </View>
              <Text style={styles.rowLabel}>Change profile photo</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            {customAvatarUri && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.row} onPress={removeCustomPhoto} activeOpacity={0.7}>
                  <View style={[styles.rowIcon, { backgroundColor: '#FFF0EE' }]}>
                    <Ionicons name="trash-outline" size={20} color={colors.red} />
                  </View>
                  <Text style={[styles.rowLabel, { color: colors.red }]}>Remove custom photo</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </>
            )}
          </View>
          {saveMsg && (
            <Text style={[styles.saveMsg, saveMsg.includes('required') && { color: colors.red }]}>
              {saveMsg}
            </Text>
          )}
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={onLogout} activeOpacity={0.7}>
              <View style={[styles.rowIcon, { backgroundColor: '#FFF0EE' }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.red} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.red }]}>Log out</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingBottom: 120 },

  header: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 8 },
  title: { fontSize: 34, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },

  avatarSection: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  avatarWrapper: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', position: 'relative' },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', borderRadius: 55 },
  userName: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 8 },
  userSub: { fontSize: 14, color: colors.textMuted },

  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F4F4F4', alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  saveMsg: { fontSize: 13, color: colors.green, fontWeight: '600', marginTop: 8, marginLeft: 4 },
});
