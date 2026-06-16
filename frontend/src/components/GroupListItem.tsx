import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Group } from '../types';

// Helper to calculate member balance sheet inside a group
const getGroupMembersBalances = (group: Group, currentUserId: string) => {
  const balances: Record<string, number> = {};

  group.members.forEach((m) => {
    if (m.userId !== currentUserId) {
      balances[m.userId] = 0;
    }
  });

  group.expenses?.forEach((ge) => {
    const payerId = ge.paidByUserId;
    ge.splits?.forEach((split) => {
      if (split.settled) return;

      if (payerId === currentUserId) {
        if (split.personId !== currentUserId) {
          balances[split.personId] = (balances[split.personId] || 0) + split.amount;
        }
      } else if (split.personId === currentUserId) {
        balances[payerId] = (balances[payerId] || 0) - split.amount;
      }
    });
  });

  return balances;
};

interface GroupListItemProps {
  group: Group;
  currentUserId: string;
  onPress: () => void;
  onLongPress?: (event: any) => void;
  selected?: boolean;
}

export default function GroupListItem({ group, currentUserId, onPress, onLongPress, selected }: GroupListItemProps) {
  const balances = getGroupMembersBalances(group, currentUserId);
  const totalNet = Object.values(balances).reduce((sum, amt) => sum + amt, 0);

  // Find members who owe or are owed
  const balanceDetails = Object.entries(balances)
    .map(([userId, amt]) => {
      const member = group.members.find((m) => m.userId === userId);
      return {
        name: member?.user.name.split(' ')[0] || 'Member',
        amount: amt,
      };
    })
    .filter((item) => Math.abs(item.amount) > 0.05);

  const hasBalance = Math.abs(totalNet) > 0.05;
  const isOwed = totalNet > 0.05;

  return (
    <TouchableOpacity
      style={[styles.groupCard, selected && styles.groupCardSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* Left Icon Container (Rounded square matching design mockup) */}
      <View style={styles.groupIconBox}>
        <Text style={styles.groupIconEmoji}>{group.icon || '👥'}</Text>
      </View>

      {/* Middle Info */}
      <View style={styles.groupDetailsBox}>
        <Text style={styles.groupNameText}>{group.name}</Text>
        {balanceDetails.length === 0 ? (
          <Text style={styles.groupMutedText}>All settled up</Text>
        ) : (
          balanceDetails.slice(0, 2).map((detail, idx) => (
            <Text key={idx} style={styles.groupSplitDetailText} numberOfLines={1}>
              {detail.name} {detail.amount > 0 ? `owes you ₹${detail.amount.toFixed(2)}` : `owes ₹${Math.abs(detail.amount).toFixed(2)}`}
            </Text>
          ))
        )}
      </View>

      {/* Right Balance */}
      <View style={styles.groupBalanceBox}>
        <Text
          style={[
            styles.balanceStatusText,
            hasBalance ? (isOwed ? styles.owedText : styles.oweText) : styles.settledText,
          ]}
        >
          {hasBalance ? (isOwed ? "You're owed" : 'You owe') : 'Settled'}
        </Text>
        <Text
          style={[
            styles.balanceAmountText,
            hasBalance ? (isOwed ? styles.owedText : styles.oweText) : styles.settledText,
          ]}
        >
          ₹{Math.abs(totalNet).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    height: 100,
    gap: 14,
  },
  groupIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupIconEmoji: {
    fontSize: 30,
  },
  groupDetailsBox: {
    flex: 1,
    justifyContent: 'center',
  },
  groupNameText: {
    color: '#DBE8E3',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  groupSplitDetailText: {
    color: '#5A7268',
    fontSize: 12,
    fontWeight: '500',
  },
  groupMutedText: {
    color: '#5A7268',
    fontSize: 12,
    fontStyle: 'italic',
  },
  groupBalanceBox: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  balanceStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  balanceAmountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  owedText: {
    color: '#00EE87',
  },
  oweText: {
    color: '#FF3B30',
  },
  settledText: {
    color: '#5A7268',
  },
  groupCardSelected: {
    borderColor: '#00EE87',
  },
});
