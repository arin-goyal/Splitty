import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, View, Animated, Text, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenWrapper from '../../components/ScreenWrapper';
import { useAppStore } from '../../store/appStore';
import api from '../../services/api';
import { Expense } from '../../types';

import SpentWidget from '../../components/dashboard/SpentWidget';
import BudgetOverview from '../../components/dashboard/BudgetOverview';
import RecentActivity from '../../components/dashboard/RecentActivity';
import AddExpenseFloatingButton from '../../components/AddExpenseFloatingButton';
import ExpenseDetailModal from '../../components/ExpenseDetailModal';

// Helper to compute date ranges for backend query filters
const getDateRangeForTimeframe = (timeframe: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  if (timeframe === 'daily') {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (timeframe === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (timeframe === 'monthly') {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
};

// Helper to compute date ranges for previous periods for trend calculations
const getPreviousDateRangeForTimeframe = (timeframe: 'daily' | 'weekly' | 'monthly') => {
  const now = new Date();
  const prevStart = new Date();
  const prevEnd = new Date();

  if (timeframe === 'daily') {
    prevStart.setDate(now.getDate() - 1);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setDate(now.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
  } else if (timeframe === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    prevStart.setDate(diff - 7);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setDate(diff);
    prevEnd.setHours(0, 0, 0, 0);
  } else if (timeframe === 'monthly') {
    prevStart.setMonth(now.getMonth() - 1);
    prevStart.setDate(1);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setDate(1);
    prevEnd.setHours(0, 0, 0, 0);
  }

  return {
    startDate: prevStart.toISOString(),
    endDate: prevEnd.toISOString(),
  };
};

const getDaysLeft = (timeframe: 'daily' | 'weekly' | 'monthly') => {
  if (timeframe === 'daily') {
    return 0;
  }
  if (timeframe === 'weekly') {
    const day = new Date().getDay();
    return day === 0 ? 0 : 7 - day;
  }
  if (timeframe === 'monthly') {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate();
  }
  return 0;
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const {
    fetchDashboardExpenses,
    fetchBudgets,
    fetchCategories,
    setIsManageBudgetVisible,
    setBudgetModalMode,
  } = useAppStore();

  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    )
  ).current;
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [prevTotal, setPrevTotal] = useState<number | null>(null);
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Function to calculate time left until midnight tonight
  const updateTimeLeft = useCallback(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diffMs = midnight.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 0) {
      setTimeLeftStr(`${diffHrs}h ${diffMins}m left`);
    } else {
      setTimeLeftStr(`${diffMins}m left`);
    }
  }, []);

  // Update time left dynamically every 30 seconds
  useEffect(() => {
    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 30000);
    return () => clearInterval(timer);
  }, [updateTimeLeft]);

  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    const filters = getDateRangeForTimeframe(timeframe);
    const fetchPreviousTotal = async () => {
      try {
        const prevRange = getPreviousDateRangeForTimeframe(timeframe);
        const response = await api.get('/expenses', { params: prevRange });
        const total = response.data.expenses.reduce((sum: number, item: any) => sum + item.amount, 0);
        setPrevTotal(total);
      } catch (error) {
        console.log('Failed to fetch previous period totals:', error);
        setPrevTotal(0);
      }
    };

    const fetchRecentExpenses = async () => {
      try {
        const response = await api.get('/expenses', { params: { limit: '3' } });
        setRecentExpenses(response.data.expenses);
      } catch (error) {
        console.log('Failed to fetch recent expenses:', error);
      }
    };

    await Promise.all([
      fetchDashboardExpenses(filters),
      fetchBudgets(),
      fetchCategories(),
      fetchPreviousTotal(),
      fetchRecentExpenses(),
    ]);
  }, [timeframe, fetchDashboardExpenses, fetchBudgets, fetchCategories]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const daysLeft = getDaysLeft(timeframe);
  const showTrendRow = daysLeft >= 0 && daysLeft <= 5;

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper scrollY={scrollY}>
        {/* ─── Spent Box Widget ─── */}
        <SpentWidget
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          prevTotal={prevTotal}
          timeLeftStr={timeLeftStr}
        />

        {/* ─── Scrollable Content Area ─── */}
        <Animated.ScrollView
          style={[
            styles.scrollContainer,
            { top: showTrendRow ? 276 : 260 }
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: showTrendRow ? 166 : 152 }
          ]}
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
          {/* ─── Budget Overview Box ─── */}
          <BudgetOverview
            onManagePress={() => {
              setBudgetModalMode('list');
              setIsManageBudgetVisible(true);
            }}
            onAddPress={() => {
              setBudgetModalMode('add');
              setIsManageBudgetVisible(true);
            }}
          />

          {/* ─── Recent Activity Section ─── */}
          <View style={styles.recentActivitySection}>
            <View style={styles.recentActivityHeader}>
              <Text style={styles.recentActivityTitle}>Recent Activity</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Expenses' as never)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentExpenses.length === 0 ? (
              <View style={styles.recentEmptyContainer}>
                <Text style={styles.recentEmptyText}>No recent activity</Text>
              </View>
            ) : (
              recentExpenses.map((expense) => (
                <RecentActivity
                  key={expense.id}
                  expense={expense}
                  onPress={() => setSelectedExpense(expense)}
                />
              ))
            )}
          </View>
        </Animated.ScrollView>
      </ScreenWrapper>
      <AddExpenseFloatingButton />

      <ExpenseDetailModal
        expense={selectedExpense}
        visible={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onDeleted={() => {
          const filters = getDateRangeForTimeframe(timeframe);
          fetchDashboardExpenses(filters);
          const fetchRecentExpenses = async () => {
            try {
              const response = await api.get('/expenses', { params: { limit: '3' } });
              setRecentExpenses(response.data.expenses);
            } catch {}
          };
          fetchRecentExpenses();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    position: 'absolute',
    top: 270,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 155,
    paddingBottom: 200,
  },
  recentActivitySection: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  recentActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  recentActivityTitle: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 24,
    color: '#B1CDC1',
  },
  viewAllText: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    color: '#5A7268',
  },
  recentEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#071317',
    borderRadius: 24,
  },
  recentEmptyText: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#5A7268',
  },
});
