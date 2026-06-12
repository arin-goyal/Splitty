import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function AiChatScreen() {
  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>AI Chat</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#7E9A8E',
    fontSize: 15,
    fontWeight: '400',
  },
});
