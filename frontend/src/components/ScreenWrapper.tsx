import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../theme/colors';
import BackgroundVector from './BackgroundVector';
import ScreenEdgeGradients from './ScreenEdgeGradients';
import TopHeader from './TopHeader';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollY?: Animated.Value;
  hideHeader?: boolean;
  /** When true, removes top padding so children can scroll behind the header */
  contentUnderHeader?: boolean;
  /** When true, hides the background dot vector illustration */
  hideBackground?: boolean;
  headerTitle?: string;
  headerIcon?: string;
  headerShowBack?: boolean;
  headerOnBackPress?: () => void;
}

export default function ScreenWrapper({
  children,
  scrollY,
  hideHeader = false,
  contentUnderHeader = false,
  hideBackground = false,
  headerTitle,
  headerIcon,
  headerShowBack,
  headerOnBackPress,
}: ScreenWrapperProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Edit this value to change the fade-in transition duration (in milliseconds)
  const FADE_DURATION = 500;

  useEffect(() => {
    if (isFocused) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      {!hideBackground && <BackgroundVector scrollY={scrollY} />}
      <ScreenEdgeGradients />
      
      {isAuthenticated && !hideHeader && (
        <TopHeader
          title={headerTitle}
          icon={headerIcon}
          showBack={headerShowBack}
          onBackPress={headerOnBackPress}
        />
      )}
      
      <Animated.View style={[
        styles.contentContainer,
        { paddingTop: contentUnderHeader ? 0 : (hideHeader ? 60 : 140), opacity: fadeAnim }
      ]}>
        {children}
      </Animated.View>
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
  },
});
