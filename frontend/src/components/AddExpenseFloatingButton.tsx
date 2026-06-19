import React from 'react';
import { StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AddExpenseFloatingButtonProps {
  groupId?: string;
}

export default function AddExpenseFloatingButton({ groupId }: AddExpenseFloatingButtonProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Position it exactly 12px above the CustomTabBar capsule
  const bottomPosition = Math.max(2, insets.bottom + 12) + 72 + 12;

  return (
    <TouchableOpacity
      style={[styles.floatingButton, { bottom: bottomPosition }]}
      onPress={() => {
        if (groupId) {
          (navigation as any).navigate('AddExpense', { groupId });
        } else {
          navigation.navigate('AddExpense' as never);
        }
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.floatingButtonPlusText}>+</Text>
      <Text style={styles.floatingButtonText}>Add Expense</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 26,
    borderRadius: 64,
    backgroundColor: '#061217',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    // iOS Glow/Box Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    boxShadow: 'inset -2px -2px 4px #053551, inset 2px 2px 4px #053835',
    // Android Elevation
    elevation: 6,
    zIndex: 9999,
  },
  floatingButtonPlusText: {
    color: '#008175',
    fontSize: 36,
    fontWeight: '400',
    lineHeight: Platform.OS === 'ios' ? 28 : 32,
  },
  floatingButtonText: {
    color: '#008175',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: Platform.OS === 'ios' ? 28 : 32,
  },
});
