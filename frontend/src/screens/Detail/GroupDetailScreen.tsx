import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle } from 'react-native-svg';
import { COLORS } from '../../theme/colors';
import ScreenWrapper from '../../components/ScreenWrapper';
import TabSlider from '../../components/TabSlider';
import ExpenseDetailModal from '../../components/ExpenseDetailModal';
import AddExpenseFloatingButton from '../../components/AddExpenseFloatingButton';
import RecentActivity from '../../components/dashboard/RecentActivity';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { Balance, GroupExpense } from '../../types';

// ─── SVG Icons ───────────────────────────────────────────────────────────────

const cleanDescription = (desc: string | null | undefined) => {
  if (!desc) return '';
  return desc.replace(/\s*\(Paid by [^)]+\)$/, '').trim();
};

const formatExpenseDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function GroupDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { groupId } = route.params as { groupId: string };

  const {
    activeGroup,
    activeGroupExpenses,
    activeGroupBalances,
    fetchGroupDetails,
    fetchGroupExpenses,
    fetchGroupBalances,
    settleSplit,
    isLoading,
  } = useAppStore();

  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState(0); // 0 = Expenses, 1 = Balances
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [isSettling, setIsSettling] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Load and refresh data on focus
  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails(groupId);
      fetchGroupExpenses(groupId);
      fetchGroupBalances(groupId);
    }, [groupId, fetchGroupDetails, fetchGroupExpenses, fetchGroupBalances])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchGroupDetails(groupId),
        fetchGroupExpenses(groupId),
        fetchGroupBalances(groupId),
      ]);
    } catch (err) {
      console.log('Failed to refresh group details:', err);
    } finally {
      setRefreshing(false);
    }
  }, [groupId, fetchGroupDetails, fetchGroupExpenses, fetchGroupBalances]);

  // Compute Net Balance for the Current User in this Group
  const getNetBalance = () => {
    if (!user) return 0;
    let net = 0;
    activeGroupBalances.forEach((b) => {
      if (b.from === user.id) {
        net -= b.amount;
      } else if (b.to === user.id) {
        net += b.amount;
      }
    });
    return net;
  };

  const netBalance = getNetBalance();
  const netText = Math.abs(netBalance).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Grouping helper for group expenses to show full expense as a single item
  const groupedGroupExpenses = React.useMemo(() => {
    const getBaseDesc = (desc: string | null) =>
      desc ? desc.replace(/\s*\(Paid by [^)]+\)$/, '').trim() : '';

    const groupsList: { rep: GroupExpense; items: GroupExpense[] }[] = [];

    activeGroupExpenses.forEach((ge) => {
      const baseDesc = getBaseDesc(ge.expense.description);
      const dateMs = new Date(ge.expense.date).getTime();
      const categoryId = ge.expense.categoryId;
      const merchant = ge.expense.merchant || '';

      const matched = groupsList.find((g) => {
        const rep = g.rep;
        const isSameCategory = rep.expense.categoryId === categoryId;
        const isSameMerchant = (rep.expense.merchant || '') === merchant;
        const isSameDate = Math.abs(new Date(rep.expense.date).getTime() - dateMs) <= 10000;
        const isSameDesc = getBaseDesc(rep.expense.description) === baseDesc;

        return isSameCategory && isSameMerchant && isSameDate && isSameDesc;
      });

      if (matched) {
        matched.items.push(ge);
      } else {
        groupsList.push({ rep: ge, items: [ge] });
      }
    });

    return groupsList.map((g) => {
      const rep = g.rep;
      const totalAmount = g.items.reduce((sum, item) => sum + item.expense.amount, 0);

      const expenseWithGroup = {
        ...rep.expense,
        amount: totalAmount,
        groupExpense: {
          id: rep.id,
          groupId: rep.groupId,
          expenseId: rep.expenseId,
          paidByUserId: rep.paidByUserId,
          splits: rep.splits,
          group: activeGroup || { id: rep.groupId, name: '', icon: '👥' },
        }
      };

      return {
        ...rep,
        expense: expenseWithGroup,
        relatedGroupExpenses: g.items,
      };
    });
  }, [activeGroupExpenses, activeGroup]);

  // Simplified balances sheet helper (Friend owes you 5, you owe friend 45 -> you owe friend 40)
  const simplifiedBalances = React.useMemo(() => {
    if (activeGroupBalances.length === 0) return [];
    
    // 1. Calculate net balance for each user
    const netBalances: Record<string, number> = {};
    activeGroupBalances.forEach((b) => {
      netBalances[b.from] = (netBalances[b.from] || 0) - b.amount;
      netBalances[b.to] = (netBalances[b.to] || 0) + b.amount;
    });

    // 2. Separate into debtors and creditors
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    Object.entries(netBalances).forEach(([userId, val]) => {
      if (val < -0.01) {
        debtors.push({ userId, amount: -val });
      } else if (val > 0.01) {
        creditors.push({ userId, amount: val });
      }
    });

    // Sort descending
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplified: Balance[] = [];
    let debtorIdx = 0;
    let creditorIdx = 0;

    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];

      const amountToSettle = Math.min(debtor.amount, creditor.amount);

      simplified.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: amountToSettle,
        description: 'Simplified debt',
      });

      debtor.amount -= amountToSettle;
      creditor.amount -= amountToSettle;

      if (debtor.amount < 0.01) debtorIdx++;
      if (creditor.amount < 0.01) creditorIdx++;
    }

    return simplified;
  }, [activeGroupBalances]);

  // Settle up split debts iteratively in both directions to settle net simplified balance
  const handleSettleBalance = async (balance: Balance) => {
    if (!activeGroup || !user) return;

    // Find all unsettled splits in the group in both directions
    const splitsToSettle: string[] = [];
    activeGroupExpenses.forEach((ge) => {
      if (ge.paidByUserId === balance.to) {
        ge.splits.forEach((split) => {
          if (!split.settled && split.personId === balance.from && split.amount > 0) {
            splitsToSettle.push(split.id);
          }
        });
      }
      if (ge.paidByUserId === balance.from) {
        ge.splits.forEach((split) => {
          if (!split.settled && split.personId === balance.to && split.amount > 0) {
            splitsToSettle.push(split.id);
          }
        });
      }
    });

    if (splitsToSettle.length === 0) {
      Alert.alert('No splits found', 'All splits between these users are already settled.');
      return;
    }

    const fromMember = activeGroup.members.find((m) => m.userId === balance.from);
    const toMember = activeGroup.members.find((m) => m.userId === balance.to);
    const fromName = fromMember ? (fromMember.userId === user.id ? 'You' : fromMember.user.name) : 'Someone';
    const toName = toMember ? (toMember.userId === user.id ? 'You' : toMember.user.name) : 'Someone';

    Alert.alert(
      'Settle Balance',
      `Are you sure you want to record a payment of ₹${balance.amount.toFixed(2)} from ${fromName} to ${toName}? This will settle all outstanding splits between you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Settle Up',
          onPress: async () => {
            setIsSettling(true);
            try {
              for (const splitId of splitsToSettle) {
                await settleSplit(activeGroup.id, splitId);
              }
              Alert.alert('Success', 'Balance settled successfully!');
              fetchGroupExpenses(activeGroup.id);
              fetchGroupBalances(activeGroup.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to settle balance.');
            } finally {
              setIsSettling(false);
            }
          },
        },
      ]
    );
  };

  const getMemberInitials = (name: string) => {
    return name.trim().charAt(0).toUpperCase();
  };

  if (isLoading && !activeGroup) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00EE87" />
      </View>
    );
  }

  if (!activeGroup) {
    return (
      <ScreenWrapper>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Group not found</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScreenWrapper
        hideHeader={false}
        headerTitle={activeGroup.name}
        headerIcon={activeGroup.icon || '👥'}
        headerShowBack={true}
        contentUnderHeader
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 140 }
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00EE87"
              colors={["#00EE87"]}
            />
          }
        >
          {/* Members Overlay Widget */}
          <View style={styles.membersWidget}>
            <Text style={styles.membersWidgetTitle}>Group Members</Text>
            <View style={styles.membersRow}>
              {activeGroup.members.map((member) => (
                <View key={member.id} style={styles.memberCircle}>
                  <Text style={styles.memberCircleText}>
                    {getMemberInitials(member.user.name)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Group Balance Summary Widget */}
          <View style={styles.summaryWidget}>
            <Text style={styles.summaryLabel}>Your Group Balance</Text>
            <Text
              style={[
                styles.summaryAmount,
                netBalance > 0.05
                  ? styles.greenAmount
                  : netBalance < -0.05
                  ? styles.redAmount
                  : styles.settledAmount,
              ]}
            >
              {netBalance > 0.05 ? '+' : netBalance < -0.05 ? '-' : ''}₹{netText}
            </Text>
            <Text style={styles.summarySubtext}>
              {netBalance > 0.05
                ? "You're owed money overall in this group"
                : netBalance < -0.05
                ? 'You owe money overall in this group'
                : 'All settled up! Settle in, relax.'}
            </Text>
          </View>

          {/* Tabs Selector */}
          <TabSlider
            tabs={['Expenses', 'Balances']}
            activeIndex={activeTab}
            onChange={(index) => setActiveTab(index)}
            style={styles.tabSlider}
            pillColor="#00EE87"
            activeTextColor="#060D10"
            inactiveTextColor="#B1CDC1"
          />

          {isSettling && (
            <ActivityIndicator size="small" color="#00EE87" style={{ marginBottom: 16 }} />
          )}

          {activeTab === 0 ? (
            // Expenses Tab List
            groupedGroupExpenses.length === 0 ? (
              <View style={styles.emptyTabContainer}>
                <Text style={styles.emptyTabText}>No group expenses yet</Text>
                <Text style={styles.emptyTabSubtext}>
                  Split a food bill, movie ticket, or utility payment here!
                </Text>
              </View>
            ) : (
              groupedGroupExpenses.map((ge) => (
                <RecentActivity
                  key={ge.id}
                  expense={ge.expense}
                  isGroupExpenseView={true}
                  onPress={() => setSelectedExpense(ge.expense)}
                />
              ))
            )
          ) : (
            // Balances Tab List
            simplifiedBalances.length === 0 ? (
              <View style={styles.emptyTabContainer}>
                <Text style={styles.emptyTabText}>All settled up!</Text>
                <Text style={styles.emptyTabSubtext}>
                  No outstanding debts between members in this group. Outstanding job!
                </Text>
              </View>
            ) : (
              simplifiedBalances.map((balance, idx) => {
                const fromMember = activeGroup.members.find((m) => m.userId === balance.from);
                const toMember = activeGroup.members.find((m) => m.userId === balance.to);
                const fromName = fromMember ? (fromMember.userId === user?.id ? 'You' : fromMember.user.name) : 'Someone';
                const toName = toMember ? (toMember.userId === user?.id ? 'You' : toMember.user.name) : 'Someone';

                const involvesMe = balance.from === user?.id || balance.to === user?.id;

                return (
                  <View key={idx} style={styles.balanceCard}>
                    <View style={styles.balanceLeft}>
                      <View style={styles.debtorCircle}>
                        <Text style={styles.debtorCircleText}>
                          {getMemberInitials(fromName)}
                        </Text>
                      </View>
                      
                      <View style={styles.balanceDetails}>
                        <Text style={styles.balanceMainText}>
                          <Text style={styles.boldText}>{fromName}</Text> owes <Text style={styles.boldText}>{toName}</Text>
                        </Text>
                        <Text style={styles.balanceAmountText}>
                          ₹{balance.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    </View>

                    {involvesMe && (
                      <TouchableOpacity
                        style={styles.settleBtn}
                        onPress={() => handleSettleBalance(balance)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.settleBtnText}>Settle</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )
          )}
        </ScrollView>
      </ScreenWrapper>

      {/* Floating Plus Add Expense Button */}
      <AddExpenseFloatingButton groupId={groupId} />

      {/* Dynamic Detail Modal for Expense View */}
      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          visible={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onDeleted={() => {
            fetchGroupExpenses(groupId);
            fetchGroupBalances(groupId);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060D10',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E9A9D',
    fontSize: 16,
    marginBottom: 20,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#00EE87',
    borderRadius: 24,
  },
  backBtnText: {
    color: '#060D10',
    fontWeight: '700',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
    backgroundColor: '#060D10',
    borderBottomWidth: 1,
    borderBottomColor: '#0D242E',
  },
  headerLeftBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 238, 135, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconEmoji: {
    fontSize: 18,
  },
  headerTitleText: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 22,
    color: '#DBE8E3',
    maxWidth: 160,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 150,
  },
  membersWidget: {
    backgroundColor: '#071317',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0D242E',
    padding: 16,
    marginBottom: 16,
  },
  membersWidgetTitle: {
    fontSize: 12,
    color: '#5A7268',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1C292E',
  },
  memberCircleText: {
    color: '#00EE87',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryWidget: {
    backgroundColor: '#071317',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0D242E',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#7E9A8E',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 6,
  },
  greenAmount: {
    color: '#00EE87',
  },
  redAmount: {
    color: '#FF3B30',
  },
  settledAmount: {
    color: '#B1CDC1',
  },
  summarySubtext: {
    fontSize: 13,
    color: '#5A7268',
    textAlign: 'center',
  },
  tabSlider: {
    marginBottom: 24,
  },
  emptyTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#071317',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0D242E',
    paddingHorizontal: 24,
  },
  emptyTabText: {
    fontSize: 18,
    color: '#B1CDC1',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyTabSubtext: {
    fontSize: 14,
    color: '#5A7268',
    textAlign: 'center',
    lineHeight: 20,
  },
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#071317',
    borderRadius: 24,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 36, 46, 0.5)',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(230, 230, 230, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconEmoji: {
    fontSize: 24,
  },
  expenseMeta: {
    marginLeft: 16,
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 4,
  },
  expensePayer: {
    fontSize: 12,
    color: '#5A7268',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseTotalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 4,
  },
  expenseShareLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#071317',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 36, 46, 0.5)',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debtorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debtorCircleText: {
    color: '#B1CDC1',
    fontSize: 15,
    fontWeight: '700',
  },
  balanceDetails: {
    marginLeft: 16,
    flex: 1,
  },
  balanceMainText: {
    fontSize: 14,
    color: '#DBE8E3',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
    color: '#B1CDC1',
  },
  balanceAmountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00EE87',
  },
  settleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#00EE87',
  },
  settleBtnText: {
    color: '#060D10',
    fontWeight: '700',
    fontSize: 13,
  },
});
