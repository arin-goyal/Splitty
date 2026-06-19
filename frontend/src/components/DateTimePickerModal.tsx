import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { COLORS } from '../theme/colors';
import * as Haptics from 'expo-haptics';
import TabSlider from './TabSlider';

interface DateTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  value: string; // ISO string
  onConfirm: (dateIsoString: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// Clock constants
const DIAL_SIZE = 220;
const DIAL_CENTER = DIAL_SIZE / 2;
const R_OUTER = 85;
const R_INNER = 52;
const NUM_BOX_SIZE = 30;

const OUTER_HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const INNER_HOURS = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const DIAL_MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function DateTimePickerModal({
  visible,
  onClose,
  value,
  onConfirm,
}: DateTimePickerModalProps) {
  // Active modal tab: date or time
  const [activePickerTab, setActivePickerTab] = useState<'date' | 'time'>('date');

  // Parsed initial date or fallback to now
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  // Month shown in calendar view
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date(value);
    const valid = !isNaN(d.getTime()) ? d : new Date();
    return new Date(valid.getFullYear(), valid.getMonth(), 1);
  });

  // Time picker states
  const [selectedHour, setSelectedHour] = useState(() => {
    const d = new Date(value);
    if (isNaN(d.getTime()) || (value && value.length === 10 && !value.includes('T'))) {
      return new Date().getHours();
    }
    return d.getHours();
  }); // 24h format (0-23)
  const [selectedMinute, setSelectedMinute] = useState(() => {
    const d = new Date(value);
    if (isNaN(d.getTime()) || (value && value.length === 10 && !value.includes('T'))) {
      return new Date().getMinutes();
    }
    return d.getMinutes();
  }); // 0-59
  const [timeMode, setTimeMode] = useState<'hours' | 'minutes'>('hours');

  // Sync initial state when modal opens
  useEffect(() => {
    if (visible) {
      const isDateOnly = value && value.length === 10 && !value.includes('T');
      
      const parsedDate = new Date(value);
      const activeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      setCurrentDate(activeDate);
      setCurrentMonth(new Date(activeDate.getFullYear(), activeDate.getMonth(), 1));

      if (isDateOnly) {
        const now = new Date();
        setSelectedHour(now.getHours());
        setSelectedMinute(now.getMinutes());
      } else {
        setSelectedHour(activeDate.getHours());
        setSelectedMinute(activeDate.getMinutes());
      }
      setTimeMode('hours');
      setActivePickerTab('date');
    }
  }, [visible, value]);

  // Calendar rendering helpers
  const year = currentMonth.getFullYear();
  const monthIndex = currentMonth.getMonth();

  // First day of current month (0: Sunday, 1: Monday, ..., 6: Saturday)
  const firstDayIndexRaw = new Date(year, monthIndex, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const firstDayIndex = firstDayIndexRaw === 0 ? 6 : firstDayIndexRaw - 1;

  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, monthIndex, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, monthIndex + 1, 1));
  };

  const handlePrevYear = () => {
    setCurrentMonth(new Date(year - 1, monthIndex, 1));
  };

  const handleNextYear = () => {
    setCurrentMonth(new Date(year + 1, monthIndex, 1));
  };

  const handleSelectDay = (day: number) => {
    const updated = new Date(currentDate);
    updated.setFullYear(year);
    updated.setMonth(monthIndex);
    updated.setDate(day);
    setCurrentDate(updated);
  };

  const handleConfirm = () => {
    // Reconstruct selected date with selected time
    const updated = new Date(currentDate);
    updated.setHours(selectedHour);
    updated.setMinutes(selectedMinute);
    updated.setSeconds(0);
    updated.setMilliseconds(0);
    onConfirm(updated.toISOString());
  };

  // Generate days array
  const cells: { day: number; isCurrentMonth: boolean; key: string }[] = [];

  // Prev month padding days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    cells.push({ day, isCurrentMonth: false, key: `prev-${day}` });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, isCurrentMonth: true, key: `curr-${d}` });
  }

  // Next month padding days to fill 35 or 42 cells grid dynamically
  const totalNeededCells = (firstDayIndex + totalDays) <= 35 ? 35 : 42;
  const remainingCells = totalNeededCells - cells.length;
  for (let d = 1; d <= remainingCells; d++) {
    cells.push({ day: d, isCurrentMonth: false, key: `next-${d}` });
  }

  // Clock touch handlers
  const handleTouch = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const dx = locationX - DIAL_CENTER;
    const dy = locationY - DIAL_CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let angle = Math.atan2(dy, dx);
    let deg = angle * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;

    if (timeMode === 'hours') {
      let h = Math.round(deg / 30);
      h = h === 0 ? 12 : h;

      if (dist < 72) {
        // Inner ring: 13-24 (where 24 is represented as 0)
        h = h === 12 ? 0 : h + 12;
      } else {
        // Outer ring: 1-12
        h = h === 12 ? 12 : h;
      }
      
      if (h !== selectedHour) {
        setSelectedHour(h);
        Haptics.selectionAsync().catch(() => {});
      }
    } else {
      let m = Math.round(deg / 6);
      m = m === 60 ? 0 : m;
      
      if (m !== selectedMinute) {
        setSelectedMinute(m);
        if (m % 5 === 0) {
          Haptics.selectionAsync().catch(() => {});
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (timeMode === 'hours') {
      setTimeout(() => {
        setTimeMode('minutes');
      }, 250);
    }
  };

  // Clock hand visual coordinates
  let handR = R_OUTER;
  let handAngleDeg = 0;

  if (timeMode === 'hours') {
    const isInner = selectedHour === 0 || (selectedHour >= 13 && selectedHour <= 23);
    handR = isInner ? R_INNER : R_OUTER;
    const hourVal = selectedHour % 12;
    handAngleDeg = hourVal * 30 - 90;
  } else {
    handR = R_OUTER;
    handAngleDeg = selectedMinute * 6 - 90;
  }

  const handAngleRad = (handAngleDeg * Math.PI) / 180;
  const handX = DIAL_CENTER + handR * Math.cos(handAngleRad);
  const handY = DIAL_CENTER + handR * Math.sin(handAngleRad);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>
        
        <View style={styles.modalContent}>
          {/* Tab Selector */}
          <TabSlider
            tabs={['Date', 'Time']}
            activeIndex={activePickerTab === 'date' ? 0 : 1}
            onChange={(idx) => setActivePickerTab(idx === 0 ? 'date' : 'time')}
            style={styles.modalTabs}
            pillColor={COLORS.primary}
          />

          {/* DATE PICKER TAB CONTENT */}
          {activePickerTab === 'date' && (
            <View>
              {/* Month & Year Navigator Header */}
              <View style={styles.monthHeaderRow}>
                <TouchableOpacity onPress={handlePrevYear} style={styles.navButton} accessibilityLabel="Previous year">
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth={2.5}>
                    <Path d="m17 18-6-6 6-6M11 18l-6-6 6-6" />
                  </Svg>
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton} accessibilityLabel="Previous month">
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth={2.5}>
                    <Path d="m15 18-6-6 6-6" />
                  </Svg>
                </TouchableOpacity>
                
                <Text style={styles.monthLabel}>
                  {MONTHS[monthIndex]} {year}
                </Text>

                <TouchableOpacity onPress={handleNextMonth} style={styles.navButton} accessibilityLabel="Next month">
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth={2.5}>
                    <Path d="m9 18 6-6-6-6" />
                  </Svg>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleNextYear} style={styles.navButton} accessibilityLabel="Next year">
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={COLORS.text} strokeWidth={2.5}>
                    <Path d="m7 18 6-6-6-6M13 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
              </View>

              {/* Weekday Labels */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day) => (
                  <Text key={day} style={styles.weekdayText}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {cells.map((cell) => {
                  const isSelected = cell.isCurrentMonth && 
                    currentDate.getDate() === cell.day &&
                    currentDate.getMonth() === monthIndex &&
                    currentDate.getFullYear() === year;

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => cell.isCurrentMonth && handleSelectDay(cell.day)}
                      disabled={!cell.isCurrentMonth}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !cell.isCurrentMonth && styles.dayTextDimmed,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {cell.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* TIME PICKER TAB CONTENT (Google Calendar Radial Style) */}
          {activePickerTab === 'time' && (
            <View style={styles.timePickerContainer}>
              <Text style={styles.timeHeaderLabel}>Select time</Text>

              {/* Digital Time Boxes */}
              <View style={styles.timeHeaderRow}>
                <TouchableOpacity
                  style={[
                    styles.timeHeaderBox,
                    timeMode === 'hours' && styles.timeHeaderBoxActive
                  ]}
                  onPress={() => setTimeMode('hours')}
                >
                  <Text
                    style={[
                      styles.timeHeaderDigits,
                      timeMode === 'hours' && styles.timeHeaderDigitsActive
                    ]}
                  >
                    {String(selectedHour).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.timeHeaderColon}>:</Text>

                <TouchableOpacity
                  style={[
                    styles.timeHeaderBox,
                    timeMode === 'minutes' && styles.timeHeaderBoxActive
                  ]}
                  onPress={() => setTimeMode('minutes')}
                >
                  <Text
                    style={[
                      styles.timeHeaderDigits,
                      timeMode === 'minutes' && styles.timeHeaderDigitsActive
                    ]}
                  >
                    {String(selectedMinute).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Radial Clock Dial */}
              <View style={styles.clockDialWrapper}>
                <View
                  style={styles.clockDial}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={handleTouch}
                  onResponderMove={handleTouch}
                  onResponderRelease={handleTouchEnd}
                >
                  {/* Svg Layer containing Hand Line & Circles (touch transparent) */}
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <Svg width={DIAL_SIZE} height={DIAL_SIZE}>
                      {/* Connection Hand Line */}
                      <Line
                        x1={DIAL_CENTER}
                        y1={DIAL_CENTER}
                        x2={handX}
                        y2={handY}
                        stroke={COLORS.primary}
                        strokeWidth={2}
                      />
                      {/* Center Pivot Dot */}
                      <Circle
                        cx={DIAL_CENTER}
                        cy={DIAL_CENTER}
                        r={4}
                        fill={COLORS.primary}
                      />
                      {/* Selection Highlight Circle */}
                      <Circle
                        cx={handX}
                        cy={handY}
                        r={15}
                        fill={COLORS.primary}
                      />
                    </Svg>
                  </View>

                  {/* Numbers Layer (touch transparent) */}
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    {timeMode === 'hours' ? (
                      <>
                        {/* Outer Ring Hours (1-12) */}
                        {OUTER_HOURS.map((h, i) => {
                          const angleRad = ((i * 30 - 90) * Math.PI) / 180;
                          const x = DIAL_CENTER + R_OUTER * Math.cos(angleRad) - NUM_BOX_SIZE / 2;
                          const y = DIAL_CENTER + R_OUTER * Math.sin(angleRad) - NUM_BOX_SIZE / 2;
                          const isSelected = selectedHour === h;

                          return (
                            <Text
                              key={`outer-h-${h}`}
                              style={[
                                styles.dialNumberText,
                                { top: y, left: x },
                                isSelected && styles.dialNumberTextSelected
                              ]}
                            >
                              {h}
                            </Text>
                          );
                        })}

                        {/* Inner Ring Hours (13-23, 00) */}
                        {INNER_HOURS.map((h, i) => {
                          const angleRad = ((i * 30 - 90) * Math.PI) / 180;
                          const x = DIAL_CENTER + R_INNER * Math.cos(angleRad) - NUM_BOX_SIZE / 2;
                          const y = DIAL_CENTER + R_INNER * Math.sin(angleRad) - NUM_BOX_SIZE / 2;
                          const isSelected = selectedHour === h;

                          return (
                            <Text
                              key={`inner-h-${h}`}
                              style={[
                                styles.dialNumberText,
                                styles.dialNumberTextInner,
                                { top: y, left: x },
                                isSelected && styles.dialNumberTextSelected
                              ]}
                            >
                              {h === 0 ? '00' : h}
                            </Text>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {/* Minutes Ring (00-55 in 5m steps) */}
                        {DIAL_MINUTES.map((m, i) => {
                          const angleRad = ((i * 30 - 90) * Math.PI) / 180;
                          const x = DIAL_CENTER + R_OUTER * Math.cos(angleRad) - NUM_BOX_SIZE / 2;
                          const y = DIAL_CENTER + R_OUTER * Math.sin(angleRad) - NUM_BOX_SIZE / 2;
                          
                          // Check if selected minute is exactly at this position or rounded to it
                          const isSelected = selectedMinute === m;

                          return (
                            <Text
                              key={`minute-${m}`}
                              style={[
                                styles.dialNumberText,
                                { top: y, left: x },
                                isSelected && styles.dialNumberTextSelected
                              ]}
                            >
                              {String(m).padStart(2, '0')}
                            </Text>
                          );
                        })}
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={onClose}>
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalSubmitBtn]} onPress={handleConfirm}>
              <Text style={styles.modalSubmitBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#071317d3',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
  },
  modalTabs: {
    borderWidth: 1,
    borderColor: '#0D242E',
    backgroundColor: 'rgba(6, 13, 16, 0.6)',
    marginBottom: 20,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 292,
    marginBottom: 16,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1,
    borderColor: '#0D242E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DBE8E3',
    minWidth: 100,
    textAlign: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 292,
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    color: '#5A7268',
    fontSize: 13,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    width: 292,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    color: '#DBE8E3',
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextDimmed: {
    color: '#1C292E',
  },
  dayTextSelected: {
    color: '#060D10',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#0D242E',
    marginVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
  },
  modalSubmitBtnText: {
    color: '#060D10',
    fontWeight: '700',
    fontSize: 15,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  modalCancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },

  // Time Picker Tab Styling
  timePickerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  timeHeaderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A7268',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeHeaderBox: {
    width: 96,
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1.5,
    borderColor: '#0D242E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeHeaderBoxActive: {
    backgroundColor: 'rgba(0, 238, 135, 0.08)',
    borderColor: COLORS.primary,
  },
  timeHeaderDigits: {
    fontSize: 42,
    fontWeight: '700',
    color: '#8E9A9D',
  },
  timeHeaderDigitsActive: {
    color: COLORS.primary,
  },
  timeHeaderColon: {
    fontSize: 42,
    fontWeight: '700',
    color: '#DBE8E3',
    marginHorizontal: 12,
  },
  clockDialWrapper: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: 'rgba(6, 13, 16, 0.4)',
    borderWidth: 1.5,
    borderColor: '#0D242E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockDial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    position: 'relative',
  },
  dialNumberText: {
    position: 'absolute',
    width: NUM_BOX_SIZE,
    height: NUM_BOX_SIZE,
    lineHeight: NUM_BOX_SIZE,
    textAlign: 'center',
    color: '#DBE8E3',
    fontSize: 14,
    fontWeight: '600',
  },
  dialNumberTextInner: {
    fontSize: 12,
    color: '#5A7268',
  },
  dialNumberTextSelected: {
    color: '#060D10',
    fontWeight: '700',
  },
});
