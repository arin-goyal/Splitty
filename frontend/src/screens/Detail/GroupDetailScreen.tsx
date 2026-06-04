import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Modal, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { User } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const { user: currentUser } = useAuthStore();
  const {
    activeGroup,
    activeGroupExpenses,
    activeGroupBalances,
    fetchGroupDetails,
    fetchGroupExpenses,
    fetchGroupBalances,
    addMemberToGroup,
    removeMemberFromGroup,
    promoteMemberToAdmin,
    demoteMemberFromAdmin,
    deleteGroupExpense,
    settleSplit,
    isLoading
  } = useAppStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'members'>('expenses');
  
  // Member add state
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchGroupDetails(groupId),
        fetchGroupExpenses(groupId),
        fetchGroupBalances(groupId)
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Find user name by ID
  const getUserName = (userId: string) => {
    if (userId === currentUser?.id) return 'You';
    const member = activeGroup?.members?.find((m) => m.userId === userId);
    return member?.user?.name || 'Unknown User';
  };

  const getIsAdmin = () => {
    const member = activeGroup?.members?.find((m) => m.userId === currentUser?.id);
    return member?.role === 'admin';
  };

  const formatCurrency = (amount: number) => {
    const currency = currentUser?.defaultCurrency || 'INR';
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

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const response = await api.get(`/auth/users/search?email=${searchEmail.trim()}`);
      setSearchResults(response.data);
    } catch (err: any) {
      setSearchError('Failed to search users.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    const success = await addMemberToGroup(groupId, userId);
    if (success) {
      setAddMemberModalVisible(false);
      setSearchEmail('');
      setSearchResults([]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerCard}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerIcon}>{activeGroup?.icon || '👥'}</Text>
        </View>
        <View style={styles.headerDetails}>
          <Text style={styles.groupName}>{activeGroup?.name || 'Group Name'}</Text>
          <Text style={styles.groupMeta}>
            Created by {activeGroup?.creator?.name || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Expenses
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'balances' && styles.activeTab]}
          onPress={() => setActiveTab('balances')}
        >
          <Text style={[styles.tabText, activeTab === 'balances' && styles.activeTabText]}>
            Balances
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members ({activeGroup?.members?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Contents */}
      <ScrollView
        style={styles.tabContentScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#007AFF" />
        }
      >
        {activeTab === 'expenses' && (
          <View style={styles.expensesTab}>
            {activeGroupExpenses.length === 0 ? (
              <View style={styles.emptyTabContainer}>
                <Text style={styles.emptyTabText}>No group expenses yet</Text>
                <Text style={styles.emptyTabSubText}>Add group expenses to split automatically</Text>
              </View>
            ) : (
              activeGroupExpenses.map((ge) => (
                <View key={ge.id} style={styles.expenseItemCard}>
                  <View style={styles.expenseItemHeader}>
                    <View style={styles.expenseLeft}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryEmoji}>{ge.expense?.category?.icon || '💰'}</Text>
                      </View>
                      <View>
                        <Text style={styles.expenseMerchant}>{ge.expense?.merchant || 'Group Expense'}</Text>
                        <Text style={styles.expenseDesc}>
                          {ge.expense?.description || ge.expense?.category?.name || 'Split'}
                        </Text>
                        <Text style={styles.expensePaidBy}>
                          Paid by <Text style={styles.boldText}>{getUserName(ge.paidByUserId)}</Text> on {formatDate(ge.expense?.date)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.expenseRight}>
                      <Text style={styles.expenseAmount}>{formatCurrency(ge.expense?.amount)}</Text>
                      {ge.paidByUserId === currentUser?.id && (
                        <TouchableOpacity
                          style={styles.deleteExpenseBtn}
                          onPress={() => deleteGroupExpense(groupId, ge.expenseId)}
                        >
                          <Text style={styles.deleteText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Splits info */}
                  <View style={styles.splitsContainer}>
                    <Text style={styles.splitsLabel}>SPLITS & SETTLEMENTS</Text>
                    {ge.splits.map((split) => {
                      const isUserSplit = split.personId === currentUser?.id;
                      const isPaidByUser = ge.paidByUserId === currentUser?.id;
                      
                      // Can settle if split is unsettled, and:
                      // - split is yours (you owe them) OR
                      // - you paid (they owe you, you received it)
                      const canSettle = !split.settled && (isUserSplit || isPaidByUser);

                      return (
                        <View key={split.id} style={styles.splitRow}>
                          <View style={styles.splitUserRow}>
                            <Text style={styles.splitUserEmoji}>👤</Text>
                            <Text style={styles.splitUserName}>
                              {getUserName(split.personId)}
                            </Text>
                            {split.settled ? (
                              <Text style={styles.settledBadge}>✓ Settled</Text>
                            ) : (
                              <Text style={styles.unsettledBadge}>Owes {formatCurrency(split.amount)}</Text>
                            )}
                          </View>
                          {canSettle && (
                            <TouchableOpacity
                              style={styles.settleBtn}
                              onPress={() => settleSplit(groupId, split.id)}
                            >
                              <Text style={styles.settleBtnText}>Settle</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'balances' && (
          <View style={styles.balancesTab}>
            {activeGroupBalances.length === 0 ? (
              <View style={styles.emptyTabContainer}>
                <Text style={styles.emptyTabText}>Everyone is settled up! 🎉</Text>
                <Text style={styles.emptyTabSubText}>No unsettled debts in this group</Text>
              </View>
            ) : (
              activeGroupBalances.map((bal, idx) => {
                const isOwedToUser = bal.to === currentUser?.id;
                const isOwedByUser = bal.from === currentUser?.id;

                let cardStyle = styles.balanceDefaultCard;
                let textStyle = styles.balanceDefaultText;
                let statement = `${getUserName(bal.from)} owes ${getUserName(bal.to)}`;

                if (isOwedByUser) {
                  cardStyle = styles.balanceOweCard;
                  textStyle = styles.balanceOweText;
                  statement = `You owe ${getUserName(bal.to)}`;
                } else if (isOwedToUser) {
                  cardStyle = styles.balanceOwedCard;
                  textStyle = styles.balanceOwedText;
                  statement = `${getUserName(bal.from)} owes you`;
                }

                return (
                  <View key={idx} style={[styles.balanceItemCard, cardStyle]}>
                    <Text style={[styles.balanceStatement, textStyle]}>
                      {statement}
                    </Text>
                    <Text style={[styles.balanceItemAmount, textStyle]}>
                      {formatCurrency(bal.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersTab}>
            {getIsAdmin() && (
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setAddMemberModalVisible(true)}
              >
                <Text style={styles.addMemberBtnText}>➕ Add Group Member</Text>
              </TouchableOpacity>
            )}

            {activeGroup?.members?.map((member) => {
              const isAdmin = member.role === 'admin';
              const isCurrentUser = member.userId === currentUser?.id;

              return (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.memberLeft}>
                    <Text style={styles.memberAvatar}>👤</Text>
                    <View>
                      <Text style={styles.memberName}>{member.user?.name}</Text>
                      <Text style={styles.memberEmail}>{member.user?.email}</Text>
                    </View>
                    {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
                  </View>

                  <View style={styles.memberActions}>
                    {getIsAdmin() && !isCurrentUser && (
                      <>
                        {isAdmin ? (
                          <TouchableOpacity
                            style={styles.adminActionBtn}
                            onPress={() => demoteMemberFromAdmin(groupId, member.userId)}
                          >
                            <Text style={styles.adminActionText}>Demote</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.adminActionBtn}
                            onPress={() => promoteMemberToAdmin(groupId, member.userId)}
                          >
                            <Text style={styles.adminActionText}>Make Admin</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.adminActionBtn, styles.removeBtn]}
                          onPress={() => removeMemberFromGroup(groupId, member.userId)}
                        >
                          <Text style={styles.removeBtnText}>Remove</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Space at the bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Add Expense inside Group Button */}
      {activeTab === 'expenses' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AddExpense', { groupId })}
        >
          <Text style={styles.fabText}>➕</Text>
        </TouchableOpacity>
      )}

      {/* User Search & Add Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addMemberModalVisible}
        onRequestClose={() => setAddMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Search & Add Member</Text>

            {searchError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {searchError}</Text>
              </View>
            )}

            <View style={styles.searchForm}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search user by email..."
                placeholderTextColor="#8E8E93"
                value={searchEmail}
                onChangeText={setSearchEmail}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearchUser}>
                <Text style={styles.searchBtnText}>Search</Text>
              </TouchableOpacity>
            </View>

            {searching ? (
              <ActivityIndicator color="#007AFF" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.resultsScroll}>
                {searchResults.map((usr) => (
                  <View key={usr.id} style={styles.resultItem}>
                    <View>
                      <Text style={styles.resultName}>{usr.name}</Text>
                      <Text style={styles.resultEmail}>{usr.email}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddMember(usr.id)}
                    >
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {searchResults.length === 0 && searchEmail.length > 0 && !searching && (
                  <Text style={styles.noResults}>No users found.</Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => {
                setAddMemberModalVisible(false);
                setSearchEmail('');
                setSearchResults([]);
              }}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  headerIcon: {
    fontSize: 28,
  },
  headerDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 13,
    color: '#8E8E93',
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
  },
  tabContentScroll: {
    flex: 1,
    padding: 16,
  },
  // Expenses tab
  expensesTab: {
    flex: 1,
  },
  emptyTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTabText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
  },
  emptyTabSubText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  expenseItemCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  expenseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 12,
    marginBottom: 12,
  },
  expenseLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseMerchant: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  expenseDesc: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  expensePaidBy: {
    fontSize: 11,
    color: '#8E8E93',
  },
  boldText: {
    fontWeight: '600',
    color: '#000000',
  },
  expenseRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  deleteExpenseBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '600',
  },
  splitsContainer: {
    width: '100%',
  },
  splitsLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 1.0,
    marginBottom: 8,
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  splitUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  splitUserEmoji: {
    fontSize: 14,
    marginRight: 8,
    opacity: 0.6,
  },
  splitUserName: {
    fontSize: 14,
    color: '#000000',
    marginRight: 10,
  },
  settledBadge: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  unsettledBadge: {
    fontSize: 13,
    color: '#FF3B30',
    fontWeight: '500',
  },
  settleBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  settleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Balances Tab
  balancesTab: {
    flex: 1,
  },
  balanceItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  balanceDefaultCard: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5EA',
  },
  balanceOweCard: {
    backgroundColor: '#FFEBEA',
    borderColor: '#FF3B30',
  },
  balanceOwedCard: {
    backgroundColor: '#E8F8EE',
    borderColor: '#34C759',
  },
  balanceStatement: {
    fontSize: 15,
    fontWeight: '600',
  },
  balanceDefaultText: {
    color: '#000000',
  },
  balanceOweText: {
    color: '#FF3B30',
  },
  balanceOwedText: {
    color: '#34C759',
  },
  balanceItemAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Members Tab
  membersTab: {
    flex: 1,
  },
  addMemberBtn: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addMemberBtnText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    fontSize: 24,
    marginRight: 12,
    opacity: 0.7,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  memberEmail: {
    fontSize: 12,
    color: '#8E8E93',
  },
  adminBadge: {
    backgroundColor: '#007AFF',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  memberActions: {
    flexDirection: 'row',
  },
  adminActionBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  adminActionText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '600',
  },
  removeBtn: {
    backgroundColor: '#FFEBEA',
    borderColor: '#FF3B30',
  },
  removeBtnText: {
    fontSize: 11,
    color: '#FF3B30',
    fontWeight: '600',
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
  // Modal Style
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchForm: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 8,
  },
  searchBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsScroll: {
    flex: 1,
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultEmail: {
    fontSize: 12,
    color: '#8E8E93',
  },
  addBtn: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  noResults: {
    textAlign: 'center',
    color: '#8E8E93',
    marginVertical: 20,
  },
  closeModalBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
  },
});
