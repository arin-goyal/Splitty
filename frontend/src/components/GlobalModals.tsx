import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  BackHandler,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useFriendStore } from '../store/friendStore';
import { useAppStore } from '../store/appStore';
import ManageBudgetsModal from './dashboard/ManageBudgetsModal';
import Button from './Button';

export default function GlobalModals() {
  const {
    friendRequests,
    sendFriendRequest,
    respondToFriendRequest,
    isLoading,
    addFriendVisible,
    setAddFriendVisible,
    requestsVisible,
    setRequestsVisible,
  } = useFriendStore();

  const {
    isManageBudgetVisible,
    setIsManageBudgetVisible,
  } = useAppStore();

  const [emailInput, setEmailInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dismiss overlays on Android back button press
  useEffect(() => {
    if (addFriendVisible || requestsVisible || isManageBudgetVisible) {
      const backAction = () => {
        setAddFriendVisible(false);
        setRequestsVisible(false);
        setIsManageBudgetVisible(false);
        setEmailInput('');
        return true;
      };
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction
      );
      return () => backHandler.remove();
    }
  }, [addFriendVisible, requestsVisible, isManageBudgetVisible]);

  const handleSendRequest = async () => {
    if (!emailInput.trim()) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setSubmitting(true);
    const res = await sendFriendRequest(emailInput.trim().toLowerCase());
    setSubmitting(false);
    if (res.success) {
      Alert.alert('Success', res.message);
      setEmailInput('');
      setAddFriendVisible(false);
    } else {
      Alert.alert('Failed', res.message);
    }
  };

  const handleRespond = async (requestId: string, status: 'accepted' | 'denied') => {
    const success = await respondToFriendRequest(requestId, status);
    if (!success) {
      Alert.alert('Error', 'Failed to respond to request. Please try again.');
    }
  };

  if (!addFriendVisible && !requestsVisible && !isManageBudgetVisible) {
    return null;
  }

  return (
    <>
      {/* ─── Add Friend Overlay ────────────────────────────────────────────────── */}
      <Modal
        visible={addFriendVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setAddFriendVisible(false);
          setEmailInput('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setAddFriendVisible(false);
            setEmailInput('');
          }}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Add Friend</Text>
            <Text style={styles.modalSubtitle}>Send a request using their email id</Text>

            <TextInput
              style={styles.textInput}
              placeholder="friend@example.com"
              placeholderTextColor="#7E9A8E"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Button
                variant="outline"
                title="Cancel"
                style={styles.modalBtn}
                onPress={() => {
                  setAddFriendVisible(false);
                  setEmailInput('');
                }}
              />

              <Button
                variant="filled"
                color="#B1CDC1"
                title="Send Request"
                style={styles.modalBtn}
                onPress={handleSendRequest}
                loading={submitting}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Friend Requests Overlay ────────────────────────────────────────────── */}
      <Modal
        visible={requestsVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setRequestsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRequestsVisible(false)}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
          >
            <Text style={styles.modalTitle}>Friend Requests</Text>

            {isLoading && friendRequests.length === 0 ? (
              <ActivityIndicator size="large" color="#00EE87" style={{ marginVertical: 24 }} />
            ) : friendRequests.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>✉️</Text>
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            ) : (
              <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
                {friendRequests.map((req) => (
                  <View key={req.id} style={styles.requestItem}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.requestName}>{req.sender.name}</Text>
                      <Text style={styles.requestEmail}>{req.sender.email}</Text>
                    </View>

                    <View style={styles.requestActions}>
                      {/* Accept Button */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnAccept]}
                        onPress={() => handleRespond(req.id, 'accepted')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionBtnAcceptText}>✓</Text>
                      </TouchableOpacity>

                      {/* Deny Button */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDeny]}
                        onPress={() => handleRespond(req.id, 'denied')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.actionBtnDenyText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            <Button
              variant="outline"
              title="Close"
              style={{ width: '100%', marginTop: 8 }}
              onPress={() => setRequestsVisible(false)}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Manage Budgets Global Overlay ────────────────────────────────────── */}
      <ManageBudgetsModal />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10000,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(7, 18, 23, 0.95)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#132531ff',
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7E9A8E',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: 52,
    borderRadius: 100,
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    borderWidth: 1,
    borderColor: '#1A3040',
    paddingHorizontal: 16,
    color: '#DBE8E3',
    fontSize: 15,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
  requestsList: {
    maxHeight: 250,
    marginVertical: 16,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(26, 48, 64, 0.4)',
  },
  requestInfo: {
    flex: 1,
    paddingRight: 12,
  },
  requestName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DBE8E3',
  },
  requestEmail: {
    fontSize: 13,
    color: '#7E9A8E',
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnAccept: {
    backgroundColor: 'rgba(0, 238, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 238, 135, 0.4)',
  },
  actionBtnAcceptText: {
    color: '#00EE87',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionBtnDeny: {
    backgroundColor: 'rgba(255, 76, 76, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 76, 0.4)',
  },
  actionBtnDenyText: {
    color: '#FF4C4C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: '#7E9A8E',
    fontSize: 14,
  },
});
