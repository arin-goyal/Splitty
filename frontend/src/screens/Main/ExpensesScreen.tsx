import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

export default function ExpensesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { expenses, fetchExpenses, categories, fetchCategories } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Date filter: 'all' | 'week' | 'month'
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');

  const loadData = useCallback(async () => {
    setRefreshing(true);
    
    // Calculate dates based on range selection
    let startDate: string | undefined;
    const now = new Date();

    if (dateFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      startDate = oneWeekAgo.toISOString();
    } else if (dateFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      startDate = oneMonthAgo.toISOString();
    }

    try {
      await Promise.all([
        fetchExpenses({
          merchant: search.trim() || undefined,
          categoryId: selectedCategory || undefined,
          startDate: startDate,
        }),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching expenses', error);
    } finally {
      setRefreshing(false);
    }
  }, [search, selectedCategory, dateFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <View style={styles.container}>
      {/* Search and Filters Header */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search merchant..."
            placeholderTextColor="#8E8E93"
            value={search}
            onChangeText={(text) => {
              setSearch(text);
            }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✖️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date Filters Row */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'all' && styles.activeChip]}
            onPress={() => setDateFilter('all')}
          >
            <Text style={[styles.chipText, dateFilter === 'all' && styles.activeChipText]}>All Time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'week' && styles.activeChip]}
            onPress={() => setDateFilter('week')}
          >
            <Text style={[styles.chipText, dateFilter === 'week' && styles.activeChipText]}>This Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, dateFilter === 'month' && styles.activeChip]}
            onPress={() => setDateFilter('month')}
          >
            <Text style={[styles.chipText, dateFilter === 'month' && styles.activeChipText]}>This Month</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrollable Categories */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 'all', name: 'All Categories', icon: '🏷️' }, ...categories]}
          keyExtractor={(item) => item.id}
          style={styles.categoryScroll}
          contentContainerStyle={{ paddingRight: 20 }}
          renderItem={({ item }) => {
            const isSelected = (item.id === 'all' && selectedCategory === null) || (selectedCategory === item.id);
            return (
              <TouchableOpacity
                style={[styles.catChip, isSelected && styles.activeCatChip]}
                onPress={() => setSelectedCategory(item.id === 'all' ? null : item.id)}
              >
                <Text style={styles.catEmoji}>{item.icon || '📦'}</Text>
                <Text style={[styles.catText, isSelected && styles.activeCatText]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Filter Stats Header */}
      <View style={styles.statsBar}>
        <Text style={styles.statsCount}>{expenses.length} expenses found</Text>
        <Text style={styles.statsTotal}>Total: <Text style={styles.statsValue}>{formatCurrency(totalSpent)}</Text></Text>
      </View>

      {/* Expense List */}
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#007AFF" />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses match your filters</Text>
            <Text style={styles.emptySubText}>Try adjusting search text or category selection</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.expenseItem}
            onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item.id })}
          >
            <View style={styles.expenseLeft}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryEmoji}>{item.category?.icon || '💰'}</Text>
              </View>
              <View style={styles.expenseDetails}>
                <Text style={styles.expenseMerchant}>{item.merchant || 'Unknown'}</Text>
                <Text style={styles.expenseDesc}>
                  {item.description || item.category?.name || 'Expense'}
                </Text>
              </View>
            </View>
            <View style={styles.expenseRight}>
              <Text style={styles.expenseAmount}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
      >
        <Text style={styles.fabText}>➕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#F5F5F5',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    padding: 0,
  },
  clearIcon: {
    fontSize: 12,
    color: '#8E8E93',
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeChip: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryScroll: {
    paddingLeft: 16,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeCatChip: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  catEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  catText: {
    fontSize: 13,
    color: '#000000',
  },
  activeCatText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statsCount: {
    fontSize: 13,
    color: '#8E8E93',
  },
  statsTotal: {
    fontSize: 14,
    color: '#000000',
  },
  statsValue: {
    fontWeight: '700',
    color: '#007AFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  fabText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
});
