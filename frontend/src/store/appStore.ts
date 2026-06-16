import { create } from 'zustand';
import api from '../services/api';
import { Expense, Group, Category, Balance, GroupExpense } from '../types';

export interface BudgetOverview {
  id: string;
  category: string;
  icon: string;
  spent: number;
  limit: number;
}

interface AppState {
  expenses: Expense[];
  expensesTotal: number;
  dashboardExpenses: Expense[];
  dashboardExpensesTotal: number;
  groups: Group[];
  activeGroup: Group | null;
  activeGroupBalances: Balance[];
  activeGroupExpenses: GroupExpense[];
  categories: Category[];
  budgets: BudgetOverview[];
  isLoading: boolean;
  error: string | null;

  setError: (error: string | null) => void;
  fetchCategories: () => Promise<void>;
  createCategory: (name: string, icon?: string) => Promise<Category | null>;
  fetchBudgets: () => Promise<void>;
  createBudget: (data: { category: string; monthlyLimit: number; icon?: string }) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<boolean>;

  // Budget Modal State
  isManageBudgetVisible: boolean;
  budgetModalMode: 'list' | 'add' | 'edit';
  setIsManageBudgetVisible: (visible: boolean) => void;
  setBudgetModalMode: (mode: 'list' | 'add' | 'edit') => void;

  // Personal Expenses
  fetchExpenses: (filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    merchant?: string;
  }) => Promise<void>;
  fetchDashboardExpenses: (filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    merchant?: string;
  }) => Promise<void>;
  createExpense: (data: {
    amount: number;
    categoryId: string;
    description?: string;
    merchant?: string;
    date?: string;
    tags?: string[];
  }) => Promise<Expense | null>;
  updateExpense: (id: string, data: {
    amount: number;
    categoryId: string;
    description?: string;
    merchant?: string;
    date?: string;
    tags?: string[];
  }) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;

  // Groups
  fetchGroups: () => Promise<void>;
  fetchGroupDetails: (groupId: string) => Promise<Group | null>;
  createGroup: (name: string, icon?: string) => Promise<Group | null>;
  updateGroup: (groupId: string, name: string, icon?: string) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  addMemberToGroup: (groupId: string, userId: string) => Promise<boolean>;
  removeMemberFromGroup: (groupId: string, memberId: string) => Promise<boolean>;
  promoteMemberToAdmin: (groupId: string, memberId: string) => Promise<boolean>;
  demoteMemberFromAdmin: (groupId: string, memberId: string) => Promise<boolean>;

  // Group Expenses & Splits
  fetchGroupExpenses: (groupId: string) => Promise<void>;
  fetchGroupBalances: (groupId: string) => Promise<void>;
  createGroupExpense: (data: {
    groupId: string;
    amount: number;
    categoryId: string;
    description?: string;
    merchant?: string;
    splitType: 'equal' | 'custom';
    customSplits?: { personId: string; amount: number }[];
    paidByUserId?: string;
    date?: string;
  }) => Promise<GroupExpense | null>;
  deleteGroupExpense: (groupId: string, expenseId: string) => Promise<boolean>;
  settleSplit: (groupId: string, splitId: string) => Promise<boolean>;
}

export const useAppStore = create<AppState>((set, get) => ({
  expenses: [],
  expensesTotal: 0,
  dashboardExpenses: [],
  dashboardExpensesTotal: 0,
  groups: [],
  activeGroup: null,
  activeGroupBalances: [],
  activeGroupExpenses: [],
  categories: [],
  budgets: [],
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),

  // Budget Modal State Implementation
  isManageBudgetVisible: false,
  budgetModalMode: 'list',
  setIsManageBudgetVisible: (visible) => set({ isManageBudgetVisible: visible }),
  setBudgetModalMode: (mode) => set({ budgetModalMode: mode }),

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/budgets');
      set({ budgets: response.data.budgets, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch budgets';
      set({ error: message, isLoading: false });
    }
  },

  createBudget: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/budgets', data);
      await get().fetchBudgets();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create budget';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/budgets/${id}`);
      await get().fetchBudgets();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to delete budget';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/expenses/categories');
      set({ categories: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch categories';
      set({ error: message, isLoading: false });
    }
  },

  createCategory: async (name, icon) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/expenses/categories', { name, icon });
      const newCategory = response.data;
      set((state) => ({
        categories: [...state.categories, newCategory],
        isLoading: false
      }));
      return newCategory;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create category';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  fetchExpenses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/expenses', { params: filters });
      set({
        expenses: response.data.expenses,
        expensesTotal: response.data.total,
        isLoading: false
      });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch expenses';
      set({ error: message, isLoading: false });
    }
  },

  fetchDashboardExpenses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/expenses', { params: filters });
      set({
        dashboardExpenses: response.data.expenses,
        dashboardExpensesTotal: response.data.total,
        isLoading: false
      });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch dashboard expenses';
      set({ error: message, isLoading: false });
    }
  },

  createExpense: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/expenses', data);
      set((state) => ({
        expenses: [response.data, ...state.expenses],
        expensesTotal: state.expensesTotal + 1,
        isLoading: false
      }));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create expense';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateExpense: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/expenses/${id}`, data);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? response.data : e)),
        dashboardExpenses: state.dashboardExpenses.map((e) => (e.id === id ? response.data : e)),
        isLoading: false,
      }));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to update expense';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/expenses/${id}`);
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        expensesTotal: Math.max(0, state.expensesTotal - 1),
        dashboardExpenses: state.dashboardExpenses.filter((e) => e.id !== id),
        dashboardExpensesTotal: Math.max(0, state.dashboardExpensesTotal - 1),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to delete expense';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/groups');
      set({ groups: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch groups';
      set({ error: message, isLoading: false });
    }
  },

  fetchGroupDetails: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/groups/${groupId}`);
      set({ activeGroup: response.data, isLoading: false });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch group details';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createGroup: async (name, icon) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/groups', { name, icon });
      set((state) => ({
        groups: [response.data, ...state.groups],
        isLoading: false,
      }));
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create group';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  updateGroup: async (groupId, name, icon) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/groups/${groupId}`, { name, icon });
      set((state) => ({
        groups: state.groups.map(g => g.id === groupId ? { ...g, ...response.data } : g),
        activeGroup: state.activeGroup?.id === groupId ? { ...state.activeGroup, ...response.data } : state.activeGroup,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to update group';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  deleteGroup: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/groups/${groupId}`);
      set((state) => ({
        groups: state.groups.filter(g => g.id !== groupId),
        activeGroup: state.activeGroup?.id === groupId ? null : state.activeGroup,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to delete group';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  addMemberToGroup: async (groupId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/groups/${groupId}/members`, { userId });
      // Refresh details
      await get().fetchGroupDetails(groupId);
      await get().fetchGroupBalances(groupId);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to add member to group';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  removeMemberFromGroup: async (groupId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/groups/${groupId}/members/${memberId}`);
      await get().fetchGroupDetails(groupId);
      await get().fetchGroupBalances(groupId);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to remove member';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  promoteMemberToAdmin: async (groupId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/groups/${groupId}/promote-admin`, { memberId });
      await get().fetchGroupDetails(groupId);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to promote member';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  demoteMemberFromAdmin: async (groupId, memberId) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/groups/${groupId}/demote-admin`, { memberId });
      await get().fetchGroupDetails(groupId);
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to demote member';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  fetchGroupExpenses: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/group-expenses/${groupId}`);
      set({ activeGroupExpenses: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch group expenses';
      set({ error: message, isLoading: false });
    }
  },

  fetchGroupBalances: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/group-expenses/${groupId}/balances`);
      set({ activeGroupBalances: response.data.balances, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch group balances';
      set({ error: message, isLoading: false });
    }
  },

  createGroupExpense: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/group-expenses', data);

      // Update local states
      set((state) => ({
        activeGroupExpenses: [response.data, ...state.activeGroupExpenses],
        isLoading: false,
      }));

      // Refresh balances
      await get().fetchGroupBalances(data.groupId);

      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to create group expense';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  deleteGroupExpense: async (groupId, expenseId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/group-expenses/${groupId}/expenses/${expenseId}`);

      set((state) => ({
        activeGroupExpenses: state.activeGroupExpenses.filter((e) => e.expenseId !== expenseId),
        isLoading: false,
      }));

      // Refresh balances
      await get().fetchGroupBalances(groupId);

      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to delete group expense';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  settleSplit: async (groupId, splitId) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/group-expenses/${groupId}/splits/${splitId}/settle`);

      // Refresh balances and expenses
      await get().fetchGroupExpenses(groupId);
      await get().fetchGroupBalances(groupId);

      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to settle split';
      set({ error: message, isLoading: false });
      return false;
    }
  },
}));
