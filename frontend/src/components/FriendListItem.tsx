import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { User, Group } from '../types';

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

// Helper to compute friend global balance across all groups
const getFriendGlobalBalance = (friendId: string, groups: Group[], currentUserId: string) => {
  let total = 0;
  groups.forEach((group) => {
    const balances = getGroupMembersBalances(group, currentUserId);
    if (balances[friendId]) {
      total += balances[friendId];
    }
  });
  return total;
};

interface FriendListItemProps {
  friend: User;
  groups: Group[];
  currentUserId: string;
  onPress?: () => void;
  onLongPress?: (event: any) => void;
  selected?: boolean;
}

export default function FriendListItem({ friend, groups, currentUserId, onPress, onLongPress, selected }: FriendListItemProps) {
  const totalNet = getFriendGlobalBalance(friend.id, groups, currentUserId);
  const hasBalance = Math.abs(totalNet) > 0.05;
  const isOwed = totalNet > 0.05;

  return (
    <TouchableOpacity
      style={[styles.friendCard, selected && styles.friendCardSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* Left Circular Avatar */}
      {friend.avatar ? (
        <Image source={{ uri: friend.avatar }} style={styles.friendAvatarImage} />
      ) : (
        <View style={styles.friendAvatarBox}>
          <Text style={styles.friendAvatarText}>{friend.name.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      {/* Middle Name */}
      <View style={styles.friendNameBox}>
        <Text style={styles.friendNameText}>{friend.name}</Text>
      </View>

      {/* Right Balance status */}
      <View style={styles.groupBalanceBox}>
        <Text
          style={[
            styles.balanceStatusText,
            hasBalance ? (isOwed ? styles.owedText : styles.oweText) : styles.settledText,
          ]}
        >
          {hasBalance ? (isOwed ? 'Owes You' : 'You Owe') : 'Settled'}
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
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071317',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    height: 80,
    gap: 14,
  },
  friendAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  friendAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D242E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendAvatarText: {
    color: '#B1CDC1',
    fontSize: 18,
    fontWeight: '700',
  },
  friendNameBox: {
    flex: 1,
    justifyContent: 'center',
  },
  friendNameText: {
    color: '#DBE8E3',
    fontSize: 16,
    fontWeight: '600',
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
  friendCardSelected: {
    borderColor: '#00EE87',
  },
});
