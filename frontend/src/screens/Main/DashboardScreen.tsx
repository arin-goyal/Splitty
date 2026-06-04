import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import api from '../../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'MainTabs'>;

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { 
    expenses, 
    fetchExpenses, 
    groups, 
    fetchGroups, 
    categories, 
    fetchCategories 
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [totalOwe, setTotalOwe] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);

  // Fetch all balances across all groups to aggregate on the dashboard
  const aggregateBalances = async (userGroups: typeof groups) => {
    if (!user || userGroups.length === 0) {
      setTotalOwe(0);
      setTotalOwed(0);
      return;
    }

    setLoadingBalances(true);
    let tempOwe = 0;
    let tempOwed = 0;

    try {
      const balancePromises = userGroups.map((g) =>
        api.get(`/group-expenses/${g.id}/balances`).catch(() => ({ data: { balances: [] } }))
      );
      const results = await Promise.all(balancePromises);

      results.forEach((res) => {
        const balancesList = res.data.balances || [];
        balancesList.forEach((bal: any) => {
          if (bal.from === user.id) {
            tempOwe += bal.amount;
          } else if (bal.to === user.id) {
            tempOwed += bal.amount;
          }
        });
      });

      setTotalOwe(tempOwe);
      setTotalOwed(tempOwed);
    } catch (err) {
      console.error('Failed to aggregate balances', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchExpenses({ limit: '10' } as any),
        fetchGroups(),
        fetchCategories()
      ]);
      // After groups are loaded, aggregate balances
      const currentGroups = useAppStore.getState().groups;
      await aggregateBalances(currentGroups);
    } catch (error) {
      console.error('Error loading dashboard data', error);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Format currency
  const formatCurrency = (amount: number) => {
    const currency = user?.defaultCurrency || 'INR';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor="#007AFF" />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <Text style={styles.avatarEmoji}>👋</Text>
      </View>

      {/* Overview Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardLabel}>TOTAL PERSONAL SPENDING</Text>
        <Text style={styles.cardValue}>{formatCurrency(totalSpent)}</Text>
        <Text style={styles.cardSubText}>From recent 10 transactions</Text>
      </View>

      {/* Group Balances Quick View */}
      <View style={styles.balanceContainer}>
        <View style={[styles.balanceCard, styles.oweCard]}>
          <Text style={styles.balanceLabel}>YOU OWE</Text>
          {loadingBalances ? (
            <ActivityIndicator size="small" color="#FF3B30" style={{ marginVertical: 4 }} />
          ) : (
            <Text style={[styles.balanceValue, styles.oweValue]}>{formatCurrency(totalOwe)}</Text>
          )}
        </View>

        <View style={[styles.balanceCard, styles.owedCard]}>
          <Text style={styles.balanceLabel}>YOU ARE OWED</Text>
          {loadingBalances ? (
            <ActivityIndicator size="small" color="#34C759" style={{ marginVertical: 4 }} />
          ) : (
            <Text style={[styles.balanceValue, styles.owedValue]}>{formatCurrency(totalOwed)}</Text>
          )}
        </View>
      </View>

      {/* Quick Action Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddExpense')}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryActionButton]}
          onPress={() => navigation.navigate('Groups')}
        >
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>View Groups</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Expenses List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
          <Text style={styles.sectionLink}>See All</Text>
        </TouchableOpacity>
      </View>

      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No recent expenses found</Text>
          <Text style={styles.emptySubText}>Add your first expense using the button above</Text>
        </View>
      ) : (
        expenses.slice(0, 5).map((expense) => (
          <TouchableOpacity
            key={expense.id}
            style={styles.expenseItem}
            onPress={() => navigation.navigate('ExpenseDetail', { expenseId: expense.id })}
          >
            <View style={styles.expenseLeft}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryEmoji}>{expense.category?.icon || '💸'}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseMerchant}>{expense.merchant || 'Unknown'}</Text>
                <Text style={styles.expenseDesc}>
                  {expense.description || expense.category?.name || 'Expense'}
                </Text>
              </View>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
              <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Padding space at the bottom */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  summaryCard: {
    backgroundColor: '#007AFF', // Solid primary color
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  cardLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
  },
  oweCard: {
    marginRight: 6,
  },
  owedCard: {
    marginLeft: 6,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.0,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  oweValue: {
    color: '#FF3B30', // Red for Owe
  },
  owedValue: {
    color: '#34C759', // Green for Owed
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  secondaryActionButton: {
    marginRight: 0,
    marginLeft: 6,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseDetails: {
    justifyContent: 'center',
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  expenseDesc: {
    fontSize: 13,
    color: '#8E8E93',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
