import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import ScreenWrapper from '../../components/ScreenWrapper';
import { COLORS } from '../../theme/colors';
import api from '../../services/api';
import ReportBugModal from '../../components/ReportBugModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const PRESET_EMOJIS = [
  '🦊', '🤖', '🍕', '🚀', '💎', '⚡', '🎨', '✈️',
  '👑', '🦄', '🦁', '🐼', '🐯', '🐱', '🐶', '🐻'
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const LockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

const UserIcon = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx={12} cy={7} r={4} />
  </Svg>
);

const EditIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#060D10" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={COLORS.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={COLORS.error} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </Svg>
);

const BugIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF9500" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2a10 10 0 0 1 10 10v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4A10 10 0 0 1 12 2z" />
    <Path d="M12 18v3" />
    <Path d="M8 12h8" />
    <Path d="M6 8.5L4 7" />
    <Path d="M18 8.5l2-1.5" />
    <Path d="M6 15.5L4 17" />
    <Path d="M18 15.5l2 1.5" />
  </Svg>
);

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isBugModalVisible, setIsBugModalVisible] = useState(false);

  // Position it exactly 12px above the CustomTabBar capsule
  const bottomPosition = Math.max(2, insets.bottom + 12) + 72 + 12;

  // Sync state if user changes in the store
  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const initials = user?.name ? user.name.trim().charAt(0).toUpperCase() : '?';

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your media library to choose a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.15,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const base64Uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setAvatar(base64Uri);
        setIsAvatarModalVisible(false);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/auth/me', {
        name: name.trim(),
        avatar: avatar,
      });

      setUser(response.data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errMsg = err.response?.data?.error || 'Failed to save changes.';
      Alert.alert('Error', errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name || '');
    setAvatar(user?.avatar || null);
    setIsEditing(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    setAvatar(emoji);
    setIsAvatarModalVisible(false);
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
    setIsAvatarModalVisible(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and will permanently delete all your expenses, groups, and split balances.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: executeDeleteAccount 
        }
      ]
    );
  };

  const executeDeleteAccount = async () => {
    setIsSaving(true);
    try {
      await api.delete('/auth/me');
      setIsSaving(false);
      logout();
      Alert.alert('Deleted', 'Your account has been deleted successfully.');
    } catch (err: any) {
      setIsSaving(false);
      console.error('Failed to delete account:', err);
      const errMsg = err.response?.data?.error || 'Failed to delete account. Please try again.';
      Alert.alert('Error', errMsg);
    }
  };

  const renderAvatarContent = () => {
    if (avatar) {
      const isEmoji = !avatar.startsWith('http') && !avatar.startsWith('data:') && !avatar.startsWith('file:');
      if (isEmoji) {
        return (
          <View style={styles.avatarEmojiContainer}>
            <Text style={styles.avatarEmoji}>{avatar}</Text>
          </View>
        );
      }
      return (
        <Image source={{ uri: avatar }} style={styles.avatarImage} />
      );
    }

    return (
      <View style={styles.avatarInitialsContainer}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
    );
  };

  return (
    <ScreenWrapper headerTitle="Profile">
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={() => {
                if (isEditing) {
                  setIsAvatarModalVisible(true);
                }
              }}
              style={[styles.avatarOuterRing, !isEditing && styles.avatarOuterRingLocked]}
              activeOpacity={isEditing ? 0.85 : 1}
            >
              <View style={styles.avatarInnerContainer}>
                {renderAvatarContent()}
              </View>
              {isEditing && (
                <View style={styles.avatarEditBadge}>
                  <EditIcon />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>

          {/* User Fields Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              {!isEditing ? (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.editBtn}
                  activeOpacity={0.7}
                >
                  <EditIcon />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  !isEditing && styles.inputWrapperLocked,
                  isEditing && isNameFocused && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.fieldIcon}>
                  <UserIcon color={isEditing && isNameFocused ? COLORS.primary : COLORS.textSecondary} />
                </View>
                <TextInput
                  style={[styles.textInput, !isEditing && styles.textInputLocked]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor={COLORS.textSecondary}
                  editable={isEditing}
                  onFocus={() => setIsNameFocused(true)}
                  onBlur={() => setIsNameFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, styles.inputWrapperLocked]}>
                <View style={styles.fieldIcon}>
                  <LockIcon />
                </View>
                <Text style={styles.lockedText}>{user?.email}</Text>
                <Text style={styles.secureBadge}>Locked</Text>
              </View>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#060D10" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Log Out Actions */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            activeOpacity={0.8}
          >
            <View style={styles.logoutContent}>
              <LogoutIcon />
              <Text style={styles.logoutText}>Log Out Account</Text>
            </View>
          </TouchableOpacity>

          {/* Delete Account Action */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <View style={styles.deleteContent}>
              <TrashIcon />
              <Text style={styles.deleteText}>Delete Account Permanently</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Floating Report Bug Button */}
        <TouchableOpacity
          style={[styles.bugBtnFloating, { bottom: bottomPosition }]}
          onPress={() => setIsBugModalVisible(true)}
          activeOpacity={0.8}
        >
          <BugIcon size={22} />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Report Bug Modal */}
      <ReportBugModal
        visible={isBugModalVisible}
        onClose={() => setIsBugModalVisible(false)}
      />

      {/* Avatar Picker Modal */}
      <Modal
        visible={isAvatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsAvatarModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Profile Avatar</Text>
              <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubheading}>Choose Preset Emoji</Text>
              <View style={styles.emojiGrid}>
                {PRESET_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiItem}
                    onPress={() => handleSelectEmoji(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiItemText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalDivider} />

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Text style={styles.modalActionText}>📷 Upload from Photo Library</Text>
              </TouchableOpacity>

              {avatar && (
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalActionBtnDelete]}
                  onPress={handleRemovePhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalActionTextDelete}>🗑️ Remove Current Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 92,
    gap: 28,
  },
  avatarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  avatarOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 238, 135, 0.05)',
  },
  avatarOuterRingLocked: {
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  avatarInnerContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
    overflow: 'hidden',
    backgroundColor: '#0E171B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmojiContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#172227',
  },
  avatarEmoji: {
    fontSize: 64,
  },
  avatarInitialsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B2A32',
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  emailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#071013',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: '#0D242E',
    padding: 20,
    gap: 20,
    boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 24,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: '#B1CDC1',
  },
  editBtnText: {
    color: '#060D10',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: 'rgba(142, 154, 157, 0.12)',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 52,
    paddingHorizontal: 16,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  inputWrapperLocked: {
    backgroundColor: 'rgba(17, 30, 36, 0.4)',
    borderColor: 'rgba(28, 41, 46, 0.5)',
  },
  fieldIcon: {
    marginRight: 12,
    opacity: 0.8,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  textInputLocked: {
    color: COLORS.textSecondary,
  },
  lockedText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  secureBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(142, 154, 157, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#060D10',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(54, 15, 13, 1)',
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  deleteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '700',
  },
  bugBtnFloating: {
    position: 'absolute',
    right: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 149, 0, 0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 9999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E171B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modalSubheading: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  emojiItem: {
    width: (width - 48 - 36) / 4,
    height: (width - 48 - 36) / 4,
    backgroundColor: 'rgba(28, 41, 46, 0.3)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(28, 41, 46, 0.6)',
  },
  emojiItemText: {
    fontSize: 32,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  modalActionBtn: {
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalActionText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  modalActionBtnDelete: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  modalActionTextDelete: {
    color: COLORS.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
