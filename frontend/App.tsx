import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';
import api from './src/services/api';

export default function App() {
  const { token, setUser, logout } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      if (token) {
        try {
          // Validate token and sync current user details
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error: any) {
          console.log('Auto-login session validation failed:', error.message);
          // If token is invalid or expired, clear store
          if (error.response && error.response.status === 401) {
            logout();
          }
        }
      }
      setAppReady(true);
    }

    initializeApp();
  }, []);

  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
