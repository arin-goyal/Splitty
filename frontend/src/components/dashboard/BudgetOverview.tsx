import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { useAppStore } from '../../store/appStore';
import { PenIcon } from './icons';
import WarningBadge from '../WarningBadge';
import Button from '../Button';

const getDynamicBudgetColor = (progress: number) => {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const hue = 130 - clamped * 130;
  return `hsl(${hue}, 50%, 50%)`;
};

interface BudgetOverviewProps {
  onManagePress: () => void;
  onAddPress: () => void;
}

export default function BudgetOverview({ onManagePress, onAddPress }: BudgetOverviewProps) {
  const navigation = useNavigation();
  const { budgets } = useAppStore();

  return (
    <View style={styles.budgetOverviewBox}>
      <View style={styles.budgetHeaderRow}>
        <Text style={styles.budgetTitle}>Budget overview</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.monthlyText, { marginRight: 12 }]}>MONTHLY</Text>
        </View>
      </View>

      {budgets.length === 0 ? (
        <View style={styles.budgetEmptyContainer}>
          <Text style={styles.budgetEmptyText}>No budgets set for this month</Text>
          <Button
            variant="filled"
            title="Add Budget"
            style={styles.addBudgetBtn}
            onPress={onAddPress}
          />
        </View>
      ) : (
        [...budgets]
          .sort((a, b) => b.spent - a.spent)
          .slice(0, 3)
          .map((budget) => {
            const progressRatio = budget.limit > 0 ? budget.spent / budget.limit : 0;
            const color = getDynamicBudgetColor(progressRatio);
            const progressPercentage = `${Math.min(progressRatio, 1) * 100}%` as any;

            return (
              <View key={budget.id} style={styles.budgetItemContainer}>
                <View style={styles.budgetItemHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, flex: 1 }}>
                    <Text style={styles.budgetItemLabel}>
                      {budget.icon} {budget.category}
                    </Text>
                    {budget.spent > budget.limit ? (
                      <WarningBadge
                        type="danger"
                        text={`OVER BY ₹${(budget.spent - budget.limit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                      />
                    ) : budget.spent === budget.limit ? (
                      <WarningBadge
                        type="warning"
                        text="100% REACHED"
                      />
                    ) : null}
                  </View>
                  <Text style={[styles.budgetItemAmount, { color }]}>
                    ₹{budget.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/₹{budget.limit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={styles.budgetProgressBarBg}>
                  <View style={[styles.budgetProgressBarFill, { width: progressPercentage, backgroundColor: color }]} />
                </View>
              </View>
            );
          })
      )}

      {budgets.length > 0 && (
        <View style={styles.budgetFooterButtons}>
          <Button
            variant="outline"
            style={styles.detailedBudgetBtn}
            onPress={() => navigation.navigate('Expenses' as never)}
          >
            <Text style={styles.detailedBudgetBtnText}>Detailed Budget</Text>
            <Svg width={21} height={15} viewBox="0 0 21 15" fill="none">
              <Path
                d="M1 6.36395C0.447715 6.36395 0 6.81167 0 7.36395C0 7.91624 0.447715 8.36395 1 8.36395V7.36395V6.36395ZM20.7071 8.07106C21.0976 7.68054 21.0976 7.04737 20.7071 6.65685L14.3431 0.292885C13.9526 -0.0976396 13.3195 -0.0976396 12.9289 0.292885C12.5384 0.683409 12.5384 1.31657 12.9289 1.7071L18.5858 7.36395L12.9289 13.0208C12.5384 13.4113 12.5384 14.0445 12.9289 14.435C13.3195 14.8255 13.9526 14.8255 14.3431 14.435L20.7071 8.07106ZM1 7.36395V8.36395H20V7.36395V6.36395H1V7.36395Z"
                fill="#5A7268"
              />
            </Svg>
          </Button>

          <TouchableOpacity
            onPress={onManagePress}
            activeOpacity={0.7}
            style={styles.addBudgetRoundBtn}
          >
            <PenIcon />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  budgetOverviewBox: {
    backgroundColor: '#071317',
    borderRadius: 36,
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetTitle: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 24,
    color: '#B1CDC1',
  },
  monthlyText: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    color: '#5A7268',
    letterSpacing: 1.5,
  },
  budgetEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  budgetEmptyText: {
    fontFamily: 'System',
    fontSize: 16,
    color: '#5A7268',
    marginBottom: 16,
  },
  addBudgetBtn: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00EE87',
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBudgetBtnText: {
    fontFamily: 'System',
    fontSize: 15,
    fontWeight: '700',
    color: '#060D10',
  },
  budgetItemContainer: {
    marginTop: 20,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetItemLabel: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '500',
    color: '#B1CDC1',
  },
  budgetItemAmount: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
  },
  budgetProgressBarBg: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F242F',
    width: '100%',
    overflow: 'hidden',
  },
  budgetProgressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetFooterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  addBudgetRoundBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5A7268',
    borderStyle: 'dashed',
  },
  detailedBudgetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#5A7268',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  detailedBudgetBtnText: {
    color: '#5A7268',
    fontSize: 20,
    fontWeight: '400',
  },
});
