import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated
} from 'react-native';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { setToken, setUser } = useAuthStore();

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    try {
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
      const message = err.response?.data?.error || 'Signup failed. Please try again.';
      setLocalError(message);
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

          {localError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {localError}</Text>
            </View>
          )}

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
    paddingHorizontal: 36, // 36px padding from left/right edges of screen
  },
  card: {
    width: '100%',
    maxWidth: 800, // max-width: 800px;
    padding: 24, // padding: 24px;
    flexDirection: 'column', // flex-direction: column;
    alignItems: 'center', // align-items: center;
    gap: 32, // gap: 32px;
    alignSelf: 'stretch', // align-self: stretch;
    borderRadius: 32, // border-radius: 32px;
    borderWidth: 2,
    borderColor: '#0D242E', // border: 2px solid #0D242E;
    backgroundColor: 'rgba(6, 13, 16, 0.70)', // background: rgba(6, 13, 16, 0.70);

    // Shadow details matching "box-shadow: 0 4px 40px 0 rgba(0, 0, 0, 0.50);"
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
  button: {
    width: '100%',
    backgroundColor: '#B1CDC1', // Logo off-white color
    height: 56,
    borderRadius: 28, // Fully rounded capsule corners
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#060D10', // Dark contrast color for readability
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '500',
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
});
