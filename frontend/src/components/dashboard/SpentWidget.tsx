import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AnalysisIcon, TrendIcon } from './icons';
import TabSlider from '../TabSlider';
import { useAppStore } from '../../store/appStore';

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

interface SpentWidgetProps {
  timeframe: 'daily' | 'weekly' | 'monthly';
  setTimeframe: (val: 'daily' | 'weekly' | 'monthly') => void;
  prevTotal: number | null;
  timeLeftStr: string;
}

export default function SpentWidget({ timeframe, setTimeframe, prevTotal, timeLeftStr }: SpentWidgetProps) {
  const navigation = useNavigation();
  const { dashboardExpenses } = useAppStore();

  const timeframes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
  const activeIndex = timeframes.indexOf(timeframe);

  const totalAmount = dashboardExpenses.reduce((sum, item) => sum + item.amount, 0);

  const formattedNumber = totalAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let percentageText = '0%';
  let isIncrease = false;

  if (prevTotal !== null) {
    if (prevTotal === 0) {
      if (totalAmount > 0) {
        percentageText = '100%';
        isIncrease = true;
      }
    } else {
      const diff = totalAmount - prevTotal;
      const percent = Math.round((Math.abs(diff) / prevTotal) * 100);
      percentageText = `${percent}%`;
      isIncrease = diff >= 0;
    }
  }

  const timeframeLabels = {
    daily: 'Total spent today',
    weekly: 'Total spent this week',
    monthly: 'Total spent this month',
  };

  const timeframeUnits = {
    daily: 'yesterday',
    weekly: 'last week',
    monthly: 'last month',
  };

  const daysLeft = getDaysLeft(timeframe);
  const showTrendRow = daysLeft >= 0 && daysLeft <= 5;

  return (
    <View style={styles.boxContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.boxTitle}>{timeframeLabels[timeframe]}</Text>
        <TouchableOpacity
          style={styles.expensesButton}
          onPress={() => navigation.navigate('Expenses' as never)}
          activeOpacity={0.7}
        >
          <AnalysisIcon />
        </TouchableOpacity>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountText}>
          <Text style={styles.currencySymbol}>₹</Text>
          {formattedNumber}
        </Text>
      </View>

      {showTrendRow && (
        <View style={styles.trendRow}>
          <View style={styles.trendLeft}>
            <TrendIcon isIncrease={isIncrease} />
            <Text style={[styles.trendText, { color: isIncrease ? '#EE8B00' : '#00EE87' }]}>
              {percentageText} from {timeframeUnits[timeframe]}
            </Text>
          </View>
          <Text style={styles.daysLeftText}>
            {daysLeft === 0 ? `(${timeLeftStr})` : `(${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left)`}
          </Text>
        </View>
      )}

      <TabSlider
        tabs={['Daily', 'Weekly', 'Monthly']}
        activeIndex={activeIndex}
        onChange={(idx) => setTimeframe(timeframes[idx])}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boxContainer: {
    position: 'absolute',
    top: 148,
    left: 24,
    right: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#071013',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 36,
    zIndex: 10,
    boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.5)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxTitle: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 24,
    color: '#B1CDC1',
  },
  expensesButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#091C24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountRow: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  amountText: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 80,
    color: '#DBE8E3',
  },
  currencySymbol: {
    fontFamily: 'BebasNeue-Regular',
    fontSize: 80,
    color: '#DBE8E3',
    marginRight: 8,
  },
  trendRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  trendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    marginLeft: 6,
    fontSize: 18,
    fontWeight: '400',
  },
  daysLeftText: {
    fontSize: 18,
    color: '#5A7268',
    fontWeight: '400',
  },
});
