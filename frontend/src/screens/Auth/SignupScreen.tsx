import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { COLORS } from '../../theme/colors';
import AppIcon from '../../components/AppIcon';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import BackgroundVector from '../../components/BackgroundVector';
import ScreenEdgeGradients from '../../components/ScreenEdgeGradients';
import Button from '../../components/Button';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    )
  ).current;

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [localLoading, setLocalLoading] = useState(false);

  const { setToken, setUser } = useAuthStore();

  // Password complexity helpers
  const lengthValid = password.length >= 8;
  const upperValid = /[A-Z]/.test(password);
  const lowerValid = /[a-z]/.test(password);
  const digitValid = /[0-9]/.test(password);
  const specialValid = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]]/.test(password);

  const isPasswordSecure = lengthValid && upperValid && lowerValid && digitValid && specialValid;

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!isPasswordSecure) {
      Alert.alert('Error', 'Please satisfy all password security requirements.');
      return;
    }

    setLocalLoading(true);

    try {
      // Direct signup without OTP
      const response = await api.post('/auth/signup', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { token, user } = response.data;
      setToken(token);
      setUser(user);
    } catch (err: any) {
      console.error('Signup error:', err);
      const message = err.response?.data?.error || 'Failed to sign up. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackgroundVector scrollY={scrollY} />
      <ScreenEdgeGradients />
      <Animated.ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Signup Card Box */}
        <View style={styles.card}>
          <AppIcon />
          <Text style={styles.title}>Create a new account</Text>

          <View style={styles.form}>
            <FloatingLabelInput
              label="Full Name"
              value={name}
              onChangeText={setName}
            />

            <FloatingLabelInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Password security requirement indicators */}
            {password.length > 0 && (
              <View style={styles.passwordRequirements}>
                <Text style={styles.requirementsHeader}>Password Strength Criteria:</Text>
                <Text style={[styles.requirementText, lengthValid && styles.requirementValid]}>
                  {lengthValid ? '✓' : '•'} At least 8 characters
                </Text>
                <Text style={[styles.requirementText, upperValid && styles.requirementValid]}>
                  {upperValid ? '✓' : '•'} At least one uppercase letter
                </Text>
                <Text style={[styles.requirementText, lowerValid && styles.requirementValid]}>
                  {lowerValid ? '✓' : '•'} At least one lowercase letter
                </Text>
                <Text style={[styles.requirementText, digitValid && styles.requirementValid]}>
                  {digitValid ? '✓' : '•'} At least one number
                </Text>
                <Text style={[styles.requirementText, specialValid && styles.requirementValid]}>
                  {specialValid ? '✓' : '•'} At least one special character
                </Text>
              </View>
            )}

            <FloatingLabelInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <Button
              variant="filled"
              color="#B1CDC1"
              textColor="#060D10"
              title="Sign Up"
              style={styles.button}
              textStyle={styles.buttonText}
              onPress={handleSignup}
              loading={localLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>


    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 36,
  },
  card: {
    width: '100%',
    maxWidth: 800,
    padding: 24,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 28,
    alignSelf: 'stretch',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0D242E',
    backgroundColor: 'rgba(6, 13, 16, 0.70)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.50,
    shadowRadius: 40,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  passwordRequirements: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(17, 30, 36, 0.4)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1C292E',
    padding: 12,
    marginTop: -8,
    gap: 4,
  },
  requirementsHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  requirementValid: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    backgroundColor: '#B1CDC1',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#060D10',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalKeyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
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
  modalTitle: {
    fontFamily: 'PlayfairDisplay-BoldItalic',
    fontSize: 28,
    color: COLORS.text,
    textAlign: 'center',
    paddingBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 20,
  },
  modalEmailHighlight: {
    color: COLORS.text,
    fontWeight: '700',
  },
  otpInput: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: '#0D242E',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    color: COLORS.primary,
    marginBottom: 20,
  },
  modalSubmitBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#060D10',
    fontSize: 15,
    fontWeight: '700',
  },
  modalErrorContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: 16,
  },
  modalErrorText: {
    color: '#FF453A',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalFooter: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  cooldownText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  modalCancelBtn: {
    marginTop: 4,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
