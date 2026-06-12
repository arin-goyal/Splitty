import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const { setToken, setUser } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setLocalLoading(true);
    setLocalError(null);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const { token, user } = response.data;
      setToken(token);
      setUser(user);
    } catch (err: any) {
      console.error('Login error:', err);
      const message = err.response?.data?.error || 'Login failed. Check your credentials.';
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
      <BackgroundVector />
      <ScreenEdgeGradients />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Login Card Box */}
        <View style={styles.card}>
          <AppIcon />

          <View style={styles.header}>
            <Text style={styles.title}>Sign In to your account</Text>
          </View>

          {localError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {localError}</Text>
            </View>
          )}

          <View style={styles.form}>
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

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={localLoading}
            >
              {localLoading ? (
                <ActivityIndicator color="#060D10" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to Splitty? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>Create an account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
