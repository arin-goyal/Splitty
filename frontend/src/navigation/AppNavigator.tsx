import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { COLORS } from '../theme/colors';
import CustomTabBar from '../components/CustomTabBar';

// Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import DashboardScreen from '../screens/Main/DashboardScreen';
import ExpensesScreen from '../screens/Main/ExpensesScreen';
import AiChatScreen from '../screens/Main/AiChatScreen';
import GroupsScreen from '../screens/Main/GroupsScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import AddExpenseScreen from '../screens/Detail/AddExpenseScreen';
import GroupDetailScreen from '../screens/Detail/GroupDetailScreen';
import ExpenseDetailScreen from '../screens/Detail/ExpenseDetailScreen';

// Navigation Params Types
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Expenses: undefined;
  AI: undefined;
  Groups: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  AddExpense: { groupId?: string };
  GroupDetail: { groupId: string };
  ExpenseDetail: { expenseId: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Custom helper function to render tab icons using simple unicode emojis for a clean/minimal look
const getTabEmoji = (routeName: string) => {
  switch (routeName) {
    case 'Dashboard': return '📊';
    case 'Expenses': return '💳';
    case 'Groups': return '👥';
    case 'Profile': return '👤';
    default: return '❓';
  }
};

const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <MainTab.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'My Expenses' }} />
      <MainTab.Screen name="AI" component={AiChatScreen} options={{ title: 'AI Chat' }} />
      <MainTab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Groups' }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </MainTab.Navigator>
  );
};

const SplittyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
  },
};

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={SplittyTheme}>
      {isAuthenticated ? (
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <RootStack.Screen 
            name="MainTabs" 
            component={MainTabNavigator} 
            options={{ headerShown: false }} 
          />
          <RootStack.Screen 
            name="AddExpense" 
            component={AddExpenseScreen} 
            options={{ title: 'Add Expense' }} 
          />
          <RootStack.Screen 
            name="GroupDetail" 
            component={GroupDetailScreen} 
            options={{ title: 'Group Details' }} 
          />
          <RootStack.Screen 
            name="ExpenseDetail" 
            component={ExpenseDetailScreen} 
            options={{ title: 'Expense Details' }} 
          />
        </RootStack.Navigator>
      ) : (
        <AuthStack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
