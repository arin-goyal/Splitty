import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';

import './src/store/alertStore'; // Hijacks Alert.alert early
import AppNavigator from './src/navigation/AppNavigator';
import GlobalModals from './src/components/GlobalModals';
import CustomAlertModal from './src/components/CustomAlertModal';
import { useAuthStore } from './src/store/authStore';
import api from './src/services/api';
import { COLORS } from './src/theme/colors';

export default function App() {
  const { token, setUser, logout } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Italic': PlayfairDisplay_400Regular_Italic,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'PlayfairDisplay-BoldItalic': PlayfairDisplay_700Bold_Italic,
    'BebasNeue-Regular': BebasNeue_400Regular,
  });

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

  if (!appReady || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AppNavigator />
      <GlobalModals />
      <CustomAlertModal />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
