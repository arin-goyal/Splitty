import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Animated, TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
}

// Eye open icon — shown when password is currently hidden (tap to reveal)
function EyeOpenIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10.0005 8.74165C11.8179 8.74165 13.2912 10.1426 13.2912 11.8708C13.2912 13.5991 11.8179 15 10.0005 15C8.18309 15 6.70979 13.5991 6.70979 11.8708C6.70979 10.1426 8.18309 8.74165 10.0005 8.74165ZM10.0005 9.91508C8.86465 9.91508 7.9438 10.7907 7.9438 11.8708C7.9438 12.9509 8.86465 13.8266 10.0005 13.8266C11.1364 13.8266 12.0572 12.9509 12.0572 11.8708C12.0572 10.7907 11.1364 9.91508 10.0005 9.91508ZM10.0005 6C13.7959 6 17.0723 8.46424 17.9814 11.9176C18.0641 12.2319 17.8632 12.5506 17.5327 12.6293C17.2021 12.7079 16.8671 12.5169 16.7843 12.2025C16.0119 9.2684 13.2265 7.17344 10.0005 7.17344C6.77309 7.17344 3.98682 9.2702 3.21577 12.2061C3.13321 12.5204 2.79826 12.7116 2.46765 12.6332C2.13705 12.5546 1.93597 12.2361 2.01853 11.9217C2.92602 8.46636 6.20343 6 10.0005 6Z"
        fill="#B1CDC1"
      />
    </Svg>
  );
}

// Eye closed icon — shown when password is currently visible (tap to hide)
function EyeClosedIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2.17574 2.17573C1.96272 2.38875 1.94336 2.72208 2.11764 2.95697L2.17574 3.02426L5.40339 6.25192C3.8658 7.3315 2.71662 8.94393 2.2391 10.8515C2.15864 11.173 2.354 11.4988 2.67545 11.5793C2.9969 11.6597 3.32272 11.4644 3.40319 11.1429C3.82677 9.45081 4.8729 8.03158 6.26733 7.11562L7.71504 8.56345C7.14903 9.14065 6.8 9.93145 6.8 10.8037C6.8 12.5711 8.23269 14.0037 10 14.0037C10.8723 14.0037 11.663 13.6547 12.2403 13.0887L16.9758 17.8243C17.2101 18.0586 17.5899 18.0586 17.8242 17.8243C18.0373 17.6113 18.0566 17.2779 17.8823 17.0431L17.8242 16.9758L12.9334 12.0844L12.9344 12.0832L11.9743 11.1249L9.6784 8.82945L9.68 8.82881L7.37502 6.52626L7.376 6.5248L6.46938 5.62039L3.02426 2.17573C2.78995 1.94142 2.41005 1.94142 2.17574 2.17573ZM8.56328 9.41241L11.3914 12.2405C11.0314 12.5891 10.5407 12.8037 10 12.8037C8.89544 12.8037 8 11.9083 8 10.8037C8 10.263 8.2146 9.77233 8.56328 9.41241ZM10 4.8C9.19976 4.8 8.42328 4.91846 7.68888 5.14L8.67848 6.12896C9.10712 6.04426 9.54912 6 10 6C13.1385 6 15.8479 8.14421 16.5977 11.1466C16.678 11.468 17.0037 11.6635 17.3252 11.5833C17.6467 11.503 17.8422 11.1773 17.7619 10.8558C16.8795 7.32218 13.6924 4.8 10 4.8ZM10.1558 7.60743L13.1968 10.648C13.1154 9.00249 11.7978 7.68612 10.1558 7.60743Z"
        fill="#B1CDC1"
      />
    </Svg>
  );
}

export default function FloatingLabelInput({ label, value, onFocus, onBlur, secureTextEntry, ...props }: FloatingLabelInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;
  // Separate animation for color — only tracks focus, not value,
  // so the label returns to muted grey when the user blurs a filled field.
  const animatedColor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: (isFocused || value) ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  useEffect(() => {
    Animated.timing(animatedColor, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: 20,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [28, -2],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedColor.interpolate({
      inputRange: [0, 1],
      outputRange: ['#7E9A8E', '#00EE87'],
    }),
    backgroundColor: '#060D10',
    paddingHorizontal: 6,
    borderRadius: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <TextInput
        {...props}
        secureTextEntry={secureTextEntry && !showPassword}
        style={[
          styles.textInput,
          {
            borderColor: isFocused ? '#00EE87' : '#7E9A8E',
            color: '#DBE8E3',
            paddingRight: secureTextEntry ? 56 : 20,
          }
        ]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        value={value}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(prev => !prev)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    width: '100%',
    position: 'relative',
    marginVertical: 0,
  },
  textInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 0,
    fontSize: 16,
    backgroundColor: 'rgba(6, 13, 16, 0.50)',
  },
  eyeButton: {
    position: 'absolute',
    right: 20,
    top: 10, // accounts for container's paddingTop
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
