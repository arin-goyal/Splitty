import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'filled' | 'outline';
  color?: string; // Custom background color (filled) or text/border color (outline)
  textColor?: string; // Custom text color
  borderColor?: string; // Custom border color (outline)
  loading?: boolean;
  title?: string;
  textStyle?: TextStyle | TextStyle[];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export default function Button({
  variant = 'filled',
  color,
  textColor,
  borderColor,
  loading = false,
  title,
  textStyle,
  style,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isFilled = variant === 'filled';

  // Determine button container styles
  const buttonStyles: ViewStyle[] = [styles.button];

  if (isFilled) {
    buttonStyles.push({
      backgroundColor: color || '#00EE87',
    });
  } else {
    buttonStyles.push({
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: borderColor || color || '#1A3040',
    });
  }

  if (style) {
    if (Array.isArray(style)) {
      buttonStyles.push(...style);
    } else {
      buttonStyles.push(style);
    }
  }

  // Determine text styles
  const resolvedTextColor = textColor || (isFilled ? '#060D10' : color || '#7E9A8E');
  const textStyles: TextStyle[] = [
    styles.text,
    { color: resolvedTextColor },
  ];

  if (textStyle) {
    if (Array.isArray(textStyle)) {
      textStyles.push(...textStyle);
    } else {
      textStyles.push(textStyle);
    }
  }

  const handlePress = (e: any) => {
    if (loading || disabled) return;
    if (props.onPress) {
      props.onPress(e);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      style={buttonStyles}
      disabled={disabled || loading}
      onPress={handlePress}
      activeOpacity={props.activeOpacity ?? 0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={resolvedTextColor} />
      ) : children ? (
        children
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
