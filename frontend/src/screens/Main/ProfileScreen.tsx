import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function ProfileScreen() {
  const { logout } = useAuthStore();

  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={logout}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  button: {
    width: '100%',
    backgroundColor: '#B1CDC1',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#060D10',
    fontSize: 16,
    fontWeight: '600',
  },
});
