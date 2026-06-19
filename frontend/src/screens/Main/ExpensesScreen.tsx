import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAppStore } from '../../store/appStore';
import { Expense } from '../../types';
import RecentActivity from '../../components/dashboard/RecentActivity';
import AddExpenseFloatingButton from '../../components/AddExpenseFloatingButton';
import ExpenseDetailModal from '../../components/ExpenseDetailModal';

export default function ExpensesScreen() {
  const { expenses, fetchExpenses, isLoading } = useAppStore();

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    )
  ).current;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchExpenses();
    } catch (err) {
      console.log('Failed to refresh expenses:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchExpenses]);

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00EE87"
              colors={["#00EE87"]}
            />
          }
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
              <RecentActivity
                key={expense.id}
                expense={expense}
                onPress={() => setSelectedExpense(expense)}
              />
            ))
          )}
        </Animated.ScrollView>
      </ScreenWrapper>
      <AddExpenseFloatingButton />

      <ExpenseDetailModal
        expense={selectedExpense}
        visible={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDeleted={() => fetchExpenses()}
      />
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
