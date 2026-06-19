import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { Expense } from '../types';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';

// ── Icons ──────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7E9A8E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

const EditIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#060D10" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </Svg>
);

const TrashIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF4C4C" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
);

const GroupIcon = () => (
  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#00EE87" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <Path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDate = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const formatTime = (dateString: string) => {
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

const cleanDescription = (desc: string | null | undefined) => {
  if (!desc) return '';
  return desc.replace(/\s*\(Paid by [^)]+\)$/, '').trim();
};

interface ExpenseDetailModalProps {
  expense: Expense | null;
  visible: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function ExpenseDetailModal({ expense, visible, onClose, onDeleted }: ExpenseDetailModalProps) {
  const navigation = useNavigation();
  const { deleteExpense, deleteGroupExpense, isLoading, groups, activeGroupExpenses, fetchGroupExpenses } = useAppStore();
  const { user } = useAuthStore();

  const [isFetching, setIsFetching] = React.useState(false);

  React.useEffect(() => {
    if (visible && expense?.groupExpense?.groupId) {
      const load = async () => {
        setIsFetching(true);
        try {
          await fetchGroupExpenses(expense.groupExpense!.groupId);
        } catch (err) {
          console.error(err);
        } finally {
          setIsFetching(false);
        }
      };
      load();
    }
  }, [visible, expense?.groupExpense?.groupId]);

  const ge = expense?.groupExpense;
  const isGroupExpense = !!ge;

  const iconText = expense ? (expense.category?.icon || (cleanDescription(expense.description) || expense.merchant || 'E')[0].toUpperCase()) : '';
  const hasIcon = !!expense?.category?.icon;

  // For group expenses: find member names from the groups store for split display
  const groupData = ge ? groups.find(g => g.id === ge.groupId) : null;
  const getMemberName = (userId: string) => {
    if (userId === user?.id) return 'You';
    const member = groupData?.members.find(m => m.userId === userId);
    return member?.user.name.split(' ')[0] || 'Member';
  };

  const getRelatedGroupExpenses = () => {
    if (!ge) return [];
    
    if (!activeGroupExpenses || activeGroupExpenses.length === 0) {
      return [{
        id: ge.id,
        groupId: ge.groupId,
        expenseId: expense.id,
        paidByUserId: ge.paidByUserId,
        splits: ge.splits,
        expense: expense
      }];
    }

    const getBaseDesc = (desc: string | null) => 
      desc ? desc.replace(/\s*\(Paid by [^)]+\)$/, '').trim() : '';

    const targetBaseDesc = getBaseDesc(expense.description);
    const targetDate = new Date(expense.date).getTime();
    const targetCategoryId = expense.categoryId;
    const targetMerchant = expense.merchant || '';

    const related = activeGroupExpenses.filter((geObj) => {
      const e = geObj.expense;
      if (!e) return false;
      
      const isSameCategory = e.categoryId === targetCategoryId;
      const isSameMerchant = (e.merchant || '') === targetMerchant;
      const isSameDate = Math.abs(new Date(e.date).getTime() - targetDate) <= 10000;
      const isSameDesc = getBaseDesc(e.description) === targetBaseDesc;

      return isSameCategory && isSameMerchant && isSameDate && isSameDesc;
    });

    if (related.length > 0) {
      return related;
    }

    return [{
      id: ge.id,
      groupId: ge.groupId,
      expenseId: expense.id,
      paidByUserId: ge.paidByUserId,
      splits: ge.splits,
      expense: expense
    }];
  };

  const relatedGroupExpenses = React.useMemo(() => getRelatedGroupExpenses(), [expense, activeGroupExpenses, ge, groupData]);
  const isMultiPayer = relatedGroupExpenses.length > 1;

  const totalExpenseAmount = React.useMemo(() => {
    if (!expense || relatedGroupExpenses.length === 0) return expense?.amount || 0;
    return relatedGroupExpenses.reduce((sum, r) => sum + (r.expense?.amount || 0), 0);
  }, [relatedGroupExpenses, expense]);

  const payersList = React.useMemo(() => {
    const payers: Record<string, { userId: string; name: string; amount: number }> = {};
    relatedGroupExpenses.forEach((r) => {
      const payerId = r.paidByUserId;
      const amt = r.expense?.amount || 0;
      if (!payers[payerId]) {
        payers[payerId] = {
          userId: payerId,
          name: getMemberName(payerId),
          amount: 0,
        };
      }
      payers[payerId].amount += amt;
    });
    return Object.values(payers);
  }, [relatedGroupExpenses, groupData]);

  const owesList = React.useMemo(() => {
    const balancesWithMe: Record<string, {
      personId: string;
      name: string;
      owesMe: number;
      iOweThem: number;
      settled: boolean;
    }> = {};

    relatedGroupExpenses.forEach((r) => {
      if (r.paidByUserId === user?.id) {
        // I paid this part. Other people owe me.
        r.splits.forEach((s) => {
          if (s.personId !== user?.id && s.amount > 0) {
            if (!balancesWithMe[s.personId]) {
              balancesWithMe[s.personId] = {
                personId: s.personId,
                name: getMemberName(s.personId),
                owesMe: 0,
                iOweThem: 0,
                settled: true,
              };
            }
            balancesWithMe[s.personId].owesMe += s.amount;
            if (!s.settled) {
              balancesWithMe[s.personId].settled = false;
            }
          }
        });
      } else {
        // Someone else paid this part. I owe them.
        const mySplit = r.splits.find(sp => sp.personId === user?.id);
        if (mySplit && mySplit.amount > 0) {
          const payerId = r.paidByUserId;
          if (!balancesWithMe[payerId]) {
            balancesWithMe[payerId] = {
              personId: payerId,
              name: getMemberName(payerId),
              owesMe: 0,
              iOweThem: 0,
              settled: true,
            };
          }
          balancesWithMe[payerId].iOweThem += mySplit.amount;
          if (!mySplit.settled) {
            balancesWithMe[payerId].settled = false;
          }
        }
      }
    });

    const list: { id: string; name: string; type: 'owes_you' | 'you_owe'; amount: number; settled: boolean }[] = [];
    Object.values(balancesWithMe).forEach((b) => {
      const netAmount = b.owesMe - b.iOweThem;
      if (netAmount > 0) {
        list.push({
          id: b.personId,
          name: b.name,
          type: 'owes_you',
          amount: netAmount,
          settled: b.settled,
        });
      } else if (netAmount < 0) {
        list.push({
          id: b.personId,
          name: b.name,
          type: 'you_owe',
          amount: -netAmount,
          settled: b.settled,
        });
      }
    });

    return list;
  }, [relatedGroupExpenses, user, groupData]);

  const handleDelete = () => {
    if (!expense) return;
    Alert.alert(
      'Delete Expense',
      `Delete "${cleanDescription(expense.description) || expense.merchant || 'this expense'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            let success = false;
            if (isGroupExpense && ge) {
              if (isMultiPayer) {
                // Delete all related group expenses
                let allSuccess = true;
                for (const r of relatedGroupExpenses) {
                  const s = await deleteGroupExpense(ge.groupId, r.expenseId);
                  if (!s) allSuccess = false;
                }
                success = allSuccess;
              } else {
                success = await deleteGroupExpense(ge.groupId, expense.id);
              }
            } else {
              success = await deleteExpense(expense.id);
            }
            if (success) {
              onClose();
              onDeleted?.();
            } else {
              Alert.alert('Error', 'Failed to delete expense.');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!expense) return;
    onClose();
    if (isGroupExpense && isMultiPayer) {
      const mappedRelated = relatedGroupExpenses.map(r => {
        if (!r.expense) return null;
        return {
          ...r.expense,
          groupExpense: {
            id: r.id,
            groupId: r.groupId,
            expenseId: r.expenseId,
            paidByUserId: r.paidByUserId,
            splits: r.splits,
          }
        };
      }).filter(Boolean);

      (navigation as any).navigate('AddExpense', { 
        editExpense: expense, 
        relatedExpenses: mappedRelated 
      });
    } else {
      (navigation as any).navigate('AddExpense', { editExpense: expense });
    }
  };

  if (!expense) return null;

  if (isFetching) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={StyleSheet.absoluteFill}
              experimentalBlurMethod="dimezisBlurView"
            />
          </TouchableOpacity>
          <View style={[styles.card, { minHeight: 200, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#00EE87" />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        </TouchableOpacity>

        <View style={styles.card}>
          {/* ── Header ── */}
          <View style={styles.cardHeader}>
            <View style={styles.iconRow}>
              <View style={styles.iconCircle}>
                <Text style={[styles.iconText, !hasIcon && styles.iconTextLetter]}>{iconText}</Text>
              </View>
              <View style={styles.nameMeta}>
                <Text style={styles.expenseName} numberOfLines={1}>
                  {cleanDescription(expense.description) || expense.merchant || 'Expense'}
                </Text>
                {isGroupExpense ? (
                  <View style={styles.groupBadge}>
                    <GroupIcon />
                    <Text style={styles.groupBadgeText}>{ge!.group.icon} {ge!.group.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.categoryLabel}>
                    {expense.category?.name || 'Uncategorised'}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <CloseIcon />
            </TouchableOpacity>
          </View>

          {/* ── Amount ── */}
          {isMultiPayer ? (
            <Text style={[styles.amount, { color: '#DBE8E3' }]}>
              ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          ) : (
            <Text style={styles.amount}>
              -₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          )}

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Details ── */}
          <ScrollView style={styles.details} showsVerticalScrollIndicator={false}>
            <DetailRow label="Category" value={`${expense.category?.icon || ''} ${expense.category?.name || 'Uncategorised'}`.trim()} />
            <DetailRow label="Date" value={formatDate(expense.date)} />
            <DetailRow label="Time" value={formatTime(expense.date)} />
            {expense.merchant ? (
              <View style={styles.noteContainer}>
                <Text style={styles.noteLabel}>Note</Text>
                <View style={styles.noteBox}>
                  <Text style={styles.noteTextValue}>{expense.merchant}</Text>
                </View>
              </View>
            ) : null}
            {expense.paymentMethod ? (
              <DetailRow label="Payment" value={expense.paymentMethod} />
            ) : null}

            {/* Group-specific details */}
            {isGroupExpense && ge && (
              <View style={styles.groupSectionSideBySide}>
                {/* Left Column: Paid By */}
                <View style={styles.groupCol}>
                  <Text style={styles.groupColTitle}>Paid By</Text>
                  <View style={styles.owesList}>
                    {payersList.map((p) => {
                      const isCurrentUserPayer = p.userId === user?.id;
                      return (
                        <View key={p.userId} style={styles.owesItem}>
                          <View style={styles.owesItemLeft}>
                            <Text style={styles.owesItemText}>{p.name}</Text>
                            <Text style={styles.owesItemSub}>paid</Text>
                          </View>
                          <Text style={[
                            styles.owesItemAmount,
                            isCurrentUserPayer ? styles.owesItemAmountRed : styles.owesItemAmountWhite
                          ]}>
                            ₹{p.amount.toFixed(2)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Right Column: Owes */}
                <View style={styles.groupCol}>
                  <Text style={styles.groupColTitle}>Owes</Text>
                  <View style={styles.owesList}>
                    {(() => {
                      if (owesList.length === 0) {
                        return (
                          <Text style={styles.noOwesText}>No balance</Text>
                        );
                      }
                      return owesList.map((o) => (
                        <View 
                          key={o.id} 
                          style={[
                            styles.owesItem, 
                            o.type === 'owes_you' ? styles.owesItemGreen : styles.owesItemRed,
                            o.settled && styles.owesItemSettled
                          ]}
                        >
                          <View style={styles.owesItemLeft}>
                            <Text style={[styles.owesItemText, o.settled && styles.owesItemTextSettled]}>
                              {o.name}
                            </Text>
                            <Text style={styles.owesItemSub}>
                              {o.type === 'owes_you' ? 'owes you' : 'you owe'}
                            </Text>
                          </View>
                          <Text style={[
                            styles.owesItemAmount,
                            o.type === 'owes_you' ? styles.owesItemAmountGreen : styles.owesItemAmountRed,
                            o.settled && styles.owesItemAmountSettled
                          ]}>
                            ₹{o.amount.toFixed(2)}
                          </Text>
                        </View>
                      ));
                    })()}
                  </View>
                </View>
              </View>
            )}

            {expense.tags && expense.tags.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagsRow}>
                  {expense.tags.map((tag, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* ── Actions ── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FF4C4C" />
              ) : (
                <>
                  <TrashIcon />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.editBtn} onPress={handleEdit} activeOpacity={0.8}>
              <EditIcon />
              <Text style={styles.editBtnText}>Edit Expense</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 10000,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(7, 18, 23, 0.97)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#132531',
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(230, 230, 230, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 30,
  },
  iconTextLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#B1CDC1',
  },
  nameMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  expenseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A7268',
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 238, 135, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 238, 135, 0.2)',
    alignSelf: 'flex-start',
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00EE87',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(177, 205, 193, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FF4C4C',
    marginTop: 12,
    marginBottom: 16,
    letterSpacing: -1,
  },
  divider: {
    height: 1,
    backgroundColor: '#132531',
    marginBottom: 12,
  },
  details: {
    maxHeight: 260,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 37, 49, 0.6)',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A7268',
    flex: 1,
    paddingTop: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B1CDC1',
    flex: 2,
    textAlign: 'right',
  },
  // Note styles
  noteContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 37, 49, 0.6)',
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5A7268',
    marginBottom: 8,
  },
  noteBox: {
    backgroundColor: 'rgba(27, 48, 59, 0.4)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(19, 37, 49, 0.8)',
  },
  noteTextValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#B1CDC1',
    lineHeight: 18,
  },
  // Group section side-by-side styles
  groupSectionSideBySide: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(19, 37, 49, 0.6)',
  },
  groupCol: {
    flex: 1,
  },
  groupColTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A7268',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payerBox: {
    backgroundColor: 'rgba(27, 48, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(19, 37, 49, 0.8)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 68,
  },
  payerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DBE8E3',
    marginBottom: 4,
  },
  payerAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#B1CDC1',
  },
  owesList: {
    gap: 8,
  },
  owesItem: {
    backgroundColor: 'rgba(27, 48, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(19, 37, 49, 0.8)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 52,
  },
  owesItemGreen: {
    borderColor: 'rgba(0, 238, 135, 0.12)',
    backgroundColor: 'rgba(0, 238, 135, 0.02)',
  },
  owesItemRed: {
    borderColor: 'rgba(255, 76, 76, 0.12)',
    backgroundColor: 'rgba(255, 76, 76, 0.02)',
  },
  owesItemSettled: {
    backgroundColor: 'rgba(90, 114, 104, 0.04)',
    borderColor: 'rgba(90, 114, 104, 0.1)',
  },
  owesItemLeft: {
    flexDirection: 'column',
  },
  owesItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DBE8E3',
  },
  owesItemTextSettled: {
    color: '#5A7268',
    textDecorationLine: 'line-through',
  },
  owesItemSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#5A7268',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  owesItemAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  owesItemAmountGreen: {
    color: '#00EE87',
  },
  owesItemAmountRed: {
    color: '#FF7070',
  },
  owesItemAmountWhite: {
    color: '#DBE8E3',
  },
  owesItemAmountSettled: {
    color: '#5A7268',
    textDecorationLine: 'line-through',
  },
  noOwesText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#5A7268',
    fontStyle: 'italic',
    paddingTop: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
    flex: 2,
  },
  tag: {
    backgroundColor: 'rgba(0, 238, 135, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 238, 135, 0.2)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00EE87',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 76, 76, 0.5)',
    paddingHorizontal: 20,
    flex: 1,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF4C4C',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 100,
    backgroundColor: '#B1CDC1',
    paddingHorizontal: 20,
    flex: 2,
  },
  editBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#060D10',
  },
});
