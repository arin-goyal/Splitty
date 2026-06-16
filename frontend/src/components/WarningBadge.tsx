import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface WarningBadgeProps {
  text: string;
  type: 'danger' | 'warning';
  style?: any;
}

export default function WarningBadge({ text, type, style }: WarningBadgeProps) {
  const isDanger = type === 'danger';
  const badgeStyle = isDanger ? styles.dangerBadge : styles.warningBadge;
  const textStyle = isDanger ? styles.dangerText : styles.warningText;

  return (
    <View style={[badgeStyle, style]}>
      <Text style={textStyle}>
        ⚠️ {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dangerBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  dangerText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warningBadge: {
    backgroundColor: 'rgba(255, 159, 10, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
  },
  warningText: {
    color: '#FF9F0A',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
