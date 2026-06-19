import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Expense } from '../../types';

const formatRecentActivityDate = (dateString: string) => {
  const d = new Date(dateString);
  const now = new Date();
  
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = nowDate.getTime() - dDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let dayStr = '';
  if (diffDays === 0) {
    dayStr = 'Today';
  } else if (diffDays === 1) {
    dayStr = 'Yesterday';
  } else {
    dayStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${dayStr}, ${timeStr}`;
};

const cleanDescription = (desc: string | null | undefined) => {
  if (!desc) return '';
  return desc.replace(/\s*\(Paid by [^)]+\)$/, '').trim();
};

interface RecentActivityProps {
  expense: Expense;
  onPress?: () => void;
  isGroupExpenseView?: boolean;
}

export default function RecentActivity({ expense, onPress, isGroupExpenseView }: RecentActivityProps) {
  const iconText = expense.category?.icon || (cleanDescription(expense.description) || expense.merchant || 'E')[0].toUpperCase();
  const hasCategory = !!expense.category?.icon;

  return (
    <TouchableOpacity style={styles.recentItemCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.recentItemLeft}>
        <View style={styles.recentCircle}>
          <Text style={[styles.recentCircleText, !hasCategory && styles.recentCircleTextLetter]}>
            {iconText}
          </Text>
        </View>
        <View style={styles.recentItemMeta}>
          <Text style={styles.recentItemMerchant} numberOfLines={1}>
            {cleanDescription(expense.description) || expense.merchant || 'Expense'}
          </Text>
          <Text style={styles.recentItemDate}>
            {formatRecentActivityDate(expense.date)}
          </Text>
        </View>
      </View>
      <Text style={[styles.recentItemAmount, isGroupExpenseView && styles.recentItemAmountWhite]}>
        {isGroupExpenseView ? '' : '-'}₹{expense.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  recentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#071317',
    borderRadius: 24,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 28,
    marginBottom: 12,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentCircle: {
    width: 60,
    height: 60,
    borderRadius: 56,
    backgroundColor: 'rgba(230, 230, 230, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentCircleText: {
    fontSize: 36,
  },
  recentCircleTextLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B1CDC1',
  },
  recentItemMeta: {
    marginLeft: 16,
    flex: 1,
  },
  recentItemMerchant: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '700',
    color: '#7E9A8E',
  },
  recentItemDate: {
    fontFamily: 'System',
    fontStyle: 'italic',
    fontSize: 16,
    color: '#5A7268',
    marginTop: 4,
  },
  recentItemAmount: {
    fontFamily: 'System',
    fontSize: 23,
    fontWeight: '700',
    color: '#FF4C4C',
  },
  recentItemAmountWhite: {
    color: '#DBE8E3',
  },
});
