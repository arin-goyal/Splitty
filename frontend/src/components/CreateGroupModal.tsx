import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { User } from '../types';

const CheckIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#060D10" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  friends: User[];
  onCreateGroup: (name: string, icon: string, selectedFriendIds: string[]) => Promise<boolean>;
  onAddFriendClick: () => void;
}

export default function CreateGroupModal({
  visible,
  onClose,
  friends,
  onCreateGroup,
  onAddFriendClick,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('👥');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Reset fields when modal visibility changes
  useEffect(() => {
    if (visible) {
      setName('');
      setIcon('👥');
      setSelectedFriendIds([]);
      setIsCreating(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a group name.');
      return;
    }
    if (selectedFriendIds.length === 0) {
      Alert.alert('Required', 'Please select at least one friend to add to the group.');
      return;
    }
    setIsCreating(true);
    try {
      const success = await onCreateGroup(name.trim(), icon, selectedFriendIds);
      if (success) {
        onClose();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to create group.');
    } finally {
      setIsCreating(false);
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
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Group</Text>
          
          <View style={styles.modalInputContainer}>
            <Text style={styles.emojiLabel}>Group Name</Text>
            <TextInput
              style={styles.modalInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Roommates, Trip 2026"
              placeholderTextColor="#5A7268"
            />
          </View>

          <View style={styles.modalInputContainer}>
            <Text style={styles.emojiLabel}>Group Icon Emoji</Text>
            <TextInput
              style={styles.modalInput}
              value={icon}
              onChangeText={setIcon}
              placeholder="e.g. 👥"
              placeholderTextColor="#5A7268"
              maxLength={4}
            />
          </View>

          <Text style={styles.emojiLabel}>Select Friends to Add (Required)</Text>
          
          {friends.length === 0 ? (
            <View style={styles.emptyFriendsSelectContainer}>
              <Text style={styles.emptyFriendsSelectText}>No friends found.</Text>
              <TouchableOpacity
                style={styles.inlineAddFriendBtn}
                onPress={onAddFriendClick}
              >
                <Text style={styles.inlineAddFriendBtnText}>➕ Add Friend by Email</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.friendsSelectContainer}>
              <ScrollView style={styles.friendsSelectScroll} nestedScrollEnabled>
                {friends.map((friend) => {
                  const isSelected = selectedFriendIds.includes(friend.id);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={styles.checkboxRowSmall}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedFriendIds(selectedFriendIds.filter((id) => id !== friend.id));
                        } else {
                          setSelectedFriendIds([...selectedFriendIds, friend.id]);
                        }
                      }}
                    >
                      <View style={[styles.checkboxBoxSmall, isSelected && styles.checkboxBoxChecked]}>
                        {isSelected && <CheckIcon />}
                      </View>
                      <Text style={styles.checkboxLabelTextSmall}>{friend.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.inlineAddFriendBtn}
                onPress={onAddFriendClick}
              >
                <Text style={styles.inlineAddFriendBtnText}>➕ Add Friend by Email</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.modalButtons, { marginTop: 16 }]}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalSubmitBtn, (isCreating || selectedFriendIds.length === 0) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={isCreating || selectedFriendIds.length === 0}
            >
              <Text style={styles.modalSubmitBtnText}>Create</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalCancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  modalContent: {
    width: '100%',
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 32,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderWidth: 1,
    borderColor: '#0D242E',
    paddingHorizontal: 16,
    color: '#DBE8E3',
    fontSize: 15,
  },
  emojiLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
  },
  modalSubmitBtnText: {
    color: '#060D10',
    fontWeight: '600',
    fontSize: 15,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
  friendsSelectScroll: {
    maxHeight: 180,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
    padding: 8,
  },
  checkboxRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 10,
  },
  checkboxBoxSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#B1CDC1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#00EE87',
    borderColor: '#00EE87',
  },
  checkboxLabelTextSmall: {
    color: '#DBE8E3',
    fontSize: 14,
    fontWeight: '500',
  },
  inlineAddFriendBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#5A7268',
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  inlineAddFriendBtnText: {
    color: '#B1CDC1',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyFriendsSelectContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 16,
  },
  emptyFriendsSelectText: {
    color: '#5A7268',
    fontSize: 14,
    marginBottom: 8,
  },
  friendsSelectContainer: {
    marginBottom: 8,
  },
});
