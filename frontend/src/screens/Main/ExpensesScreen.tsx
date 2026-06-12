import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';

export default function ExpensesScreen() {
  return (
    <ScreenWrapper>
      <View style={styles.content}>
        <Text style={styles.text}>Expenses Screen Placeholder</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: COLORS.text,
    fontSize: 18,
  },
});
