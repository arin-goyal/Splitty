import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../theme/colors';
import BackgroundVector from './BackgroundVector';
import ScreenEdgeGradients from './ScreenEdgeGradients';
import TopHeader from './TopHeader';

interface ScreenWrapperProps {
  children: React.ReactNode;
}

export default function ScreenWrapper({ children }: ScreenWrapperProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <View style={styles.container}>
      <BackgroundVector />
      <ScreenEdgeGradients />
      
      {isAuthenticated && <TopHeader />}
      
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 140, // Keeps screen content safe from overlapping absolute top header
  },
});
