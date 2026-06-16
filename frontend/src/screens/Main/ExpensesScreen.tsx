import React, { useCallback, useRef } from 'react';
import { StyleSheet, Text, View, Animated, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAppStore } from '../../store/appStore';
import RecentActivity from '../../components/dashboard/RecentActivity';
import AddExpenseFloatingButton from '../../components/AddExpenseFloatingButton';

export default function ExpensesScreen() {
  const { expenses, fetchExpenses, isLoading } = useAppStore();

  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    )
  ).current;

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [fetchExpenses])
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper scrollY={scrollY} contentUnderHeader>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.header}>
            <Text style={styles.title}>All Expenses</Text>
          </View>

          {isLoading && expenses.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : expenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No expenses tracked yet</Text>
            </View>
          ) : (
            expenses.map((expense) => (
              <RecentActivity key={expense.id} expense={expense} />
            ))
          )}
        </Animated.ScrollView>
      </ScreenWrapper>
      <AddExpenseFloatingButton />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 140,
    paddingBottom: 200,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 32,
    color: '#B1CDC1',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#071317',
    borderRadius: 24,
  },
  emptyText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#5A7268',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
