import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

import { useAuthStore } from '../store/authStore';

// Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import DashboardScreen from '../screens/Main/DashboardScreen';
import ExpensesScreen from '../screens/Main/ExpensesScreen';
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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          // Use unicode characters with opacity adjustments
          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
              {getTabEmoji(route.name)}
            </Text>
          );
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F5F5F5',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        headerStyle: {
          backgroundColor: '#FFFFFF',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5EA',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: '#000000',
        },
      })}
    >
      <MainTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <MainTab.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'My Expenses' }} />
      <MainTab.Screen name="Groups" component={GroupsScreen} options={{ title: 'Groups' }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </MainTab.Navigator>
  );
};

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <RootStack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#FFFFFF',
            },
            headerTintColor: '#007AFF',
            headerTitleStyle: {
              fontWeight: '600',
              color: '#000000',
            },
            headerShadowVisible: false,
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
    backgroundColor: '#FFFFFF',
  },
});
