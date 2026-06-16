import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

interface TabSliderProps {
  tabs: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  style?: any;
  pillColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
}

export default function TabSlider({
  tabs,
  activeIndex,
  onChange,
  style,
  pillColor,
  activeTextColor,
  inactiveTextColor,
}: TabSliderProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const sliderAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(sliderAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 30,
      friction: 6,
    }).start();
  }, [activeIndex]);

  const pillWidth = containerWidth > 0 ? (containerWidth - 12) / tabs.length : 0;
  
  const translateX = sliderAnim.interpolate({
    inputRange: tabs.map((_, i) => i),
    outputRange: tabs.map((_, i) => i * pillWidth),
  });

  return (
    <View
      style={[styles.sliderCapsule, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Animated sliding pill */}
      {pillWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sliderPill,
            {
              width: pillWidth,
              transform: [{ translateX }],
              backgroundColor: pillColor || '#B1CDC1',
            },
          ]}
        />
      )}

      {tabs.map((tab, index) => {
        const isActive = activeIndex === index;
        return (
          <TouchableOpacity
            key={tab}
            style={styles.sliderTab}
            onPress={() => onChange(index)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.sliderTabText,
                inactiveTextColor ? { color: inactiveTextColor } : null,
                isActive && styles.sliderTabTextActive,
                isActive && activeTextColor ? { color: activeTextColor } : null,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sliderCapsule: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderRadius: 24,
    backgroundColor: '#08141aff',
    position: 'relative',
  },
  sliderPill: {
    position: 'absolute',
    left: 6,
    top: 5,
    bottom: 5,
    borderRadius: 20,
    backgroundColor: '#B1CDC1',
  },
  sliderTab: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  sliderTabText: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '700',
    color: '#5A7268',
  },
  sliderTabTextActive: {
    color: '#060D10',
    fontWeight: '700',
  },
});
