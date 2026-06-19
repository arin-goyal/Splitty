import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';
import api from '../services/api';

interface ReportBugModalProps {
  visible: boolean;
  onClose: () => void;
}

const CRITICALITY_LABELS = [
  'Low - Minor UI issue or typo',
  'Minor - Annoying but doesn\'t block usage',
  'Moderate - Bug affects some functionality',
  'High - Major feature is broken',
  'Critical - App crashes or blocks usage',
];

export default function ReportBugModal({ visible, onClose }: ReportBugModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [criticality, setCriticality] = useState(3); // Default to Moderate (3/5)
  const [loading, setLoading] = useState(false);

  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);

  const handleSendReport = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required', 'Please fill in both the title and description.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/bugs', {
        title: title.trim(),
        description: description.trim(),
        criticality,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thank You', response.data.message || 'Bug report submitted successfully!');
      
      // Reset and close
      setTitle('');
      setDescription('');
      setCriticality(3);
      onClose();
    } catch (err: any) {
      console.error('Failed to submit bug:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errMsg = err.response?.data?.error || 'Failed to send bug report. Please try again.';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getExclamationColor = (index: number) => {
    if (index > criticality) {
      return 'rgba(142, 154, 157, 0.25)'; // Dimmed / Unselected
    }
    // Color coded based on the active criticality level
    switch (criticality) {
      case 1: return '#34C759'; // Low: Green
      case 2: return '#86C734'; // Minor: Lime Green
      case 3: return '#FFCC00'; // Moderate: Yellow
      case 4: return '#FF9500'; // High: Orange
      case 5: return '#FF3B30'; // Critical: Red
      default: return COLORS.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report a Bug</Text>
            <Text style={styles.modalSubtitle}>Help us improve Splitty. Describe what went wrong.</Text>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bug Title</Text>
              <View
                style={[
                  styles.inputWrapper,
                  isTitleFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Short summary (e.g. Settle up screen crashed)"
                  placeholderTextColor={COLORS.textSecondary}
                  onFocus={() => setIsTitleFocused(true)}
                  onBlur={() => setIsTitleFocused(false)}
                />
              </View>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Describe the issue</Text>
              <View
                style={[
                  styles.inputWrapper,
                  styles.multilineWrapper,
                  isDescFocused && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Tell us what you were doing, what you expected, and what happened..."
                  placeholderTextColor={COLORS.textSecondary}
                  multiline
                  numberOfLines={4}
                  onFocus={() => setIsDescFocused(true)}
                  onBlur={() => setIsDescFocused(false)}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Criticality Rating */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Severity / Criticality</Text>
              <View style={styles.ratingBar}>
                {[1, 2, 3, 4, 5].map((index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={() => {
                      setCriticality(index);
                      Haptics.selectionAsync();
                    }}
                    style={styles.exclamationTouch}
                  >
                    <Text
                      style={[
                        styles.exclamationText,
                        { color: getExclamationColor(index) }
                      ]}
                    >
                      !
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[
                styles.criticalityLabel,
                { color: getExclamationColor(criticality) }
              ]}>
                {CRITICALITY_LABELS[criticality - 1]}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={handleSendReport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#060D10" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Send Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#071317d3',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 32,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -8,
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0D242E',
    height: 48,
    paddingHorizontal: 12,
  },
  multilineWrapper: {
    height: 100,
    paddingVertical: 10,
    borderRadius: 14,
  },
  inputWrapperFocused: {
    borderColor: COLORS.primary,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  ratingBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginVertical: 4,
  },
  exclamationTouch: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0D242E',
  },
  exclamationText: {
    fontSize: 26,
    fontWeight: '900',
    marginTop: -2,
  },
  criticalityLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
  },
  modalSubmitBtnText: {
    color: '#060D10',
    fontWeight: '700',
    fontSize: 14,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: '#0D242E',
    backgroundColor: 'rgba(142, 154, 157, 0.05)',
  },
  modalCancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
