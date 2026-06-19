import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useAlertStore, AlertButton } from '../store/alertStore';
import { COLORS } from '../theme/colors';

export default function CustomAlertModal() {
  const { visible, title, message, buttons, options, hideAlert } = useAlertStore();

  if (!visible) return null;

  const alertButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert();
    if (btn.onPress) {
      btn.onPress();
    }
  };

  const handleBackdropPress = () => {
    if (options?.cancelable) {
      hideAlert();
    }
  };

  // Determine layout structure: horizontal for 2 buttons, vertical for 1 or 3+
  const isHorizontalLayout = alertButtons.length === 2;

  const renderButton = (btn: AlertButton, index: number) => {
    const isDestructive = btn.style === 'destructive';
    const isCancel = btn.style === 'cancel';

    let btnStyle = styles.defaultBtn;
    let textStyle = styles.defaultBtnText;

    if (isDestructive) {
      btnStyle = styles.destructiveBtn;
      textStyle = styles.destructiveBtnText;
    } else if (isCancel) {
      btnStyle = styles.cancelBtn;
      textStyle = styles.cancelBtnText;
    }

    return (
      <TouchableOpacity
        key={index}
        style={[styles.btnBase, btnStyle, isHorizontalLayout && { flex: 1 }]}
        onPress={() => handleButtonPress(btn)}
        activeOpacity={0.8}
      >
        <Text style={[styles.btnTextBase, textStyle]}>{btn.text || 'OK'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (options?.cancelable) {
          hideAlert();
        }
      }}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFill}
            experimentalBlurMethod="dimezisBlurView"
          />
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={[styles.buttonContainer, isHorizontalLayout ? styles.row : styles.column]}>
            {alertButtons.map((btn, idx) => renderButton(btn, idx))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#071317d3',
    borderWidth: 1,
    borderColor: '#0D242E',
    borderRadius: 36,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingBottom: 8,
  },
  message: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    fontWeight: '400',
  },
  buttonContainer: {
    marginTop: 24,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flexDirection: 'column',
    gap: 10,
  },
  btnBase: {
    height: 48,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  btnTextBase: {
    fontSize: 14,
    fontWeight: '700',
  },
  defaultBtn: {
    backgroundColor: COLORS.primary,
  },
  defaultBtnText: {
    color: '#060D10',
  },
  cancelBtn: {
    backgroundColor: 'rgba(142, 154, 157, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(142, 154, 157, 0.25)',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
  },
  destructiveBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  destructiveBtnText: {
    color: COLORS.error,
  },
});
