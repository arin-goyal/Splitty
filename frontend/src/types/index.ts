export interface User {
  id: string;
  email: string;
  name: string;
  defaultCurrency?: string;
  avatar?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color?: string | null;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  categoryId: string;
  category: Category;
  description: string | null;
  merchant: string | null;
  date: string;
  paymentMethod: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  /** Present when this expense is part of a group split */
  groupExpense?: {
    id: string;
    groupId: string;
    paidByUserId: string;
    group: {
      id: string;
      name: string;
      icon: string | null;
    };
    splits: Split[];
  };
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  user: User;
}

export interface GroupExpense {
  id: string;
  groupId: string;
  expenseId: string;
  expense: Expense;
  paidByUserId: string;
  splits: Split[];
  createdAt: string;
}

export interface Split {
  id: string;
  groupExpenseId: string;
  personId: string;
  amount: number;
  settled: boolean;
  settledAt: string | null;
}

export interface Group {
  id: string;
  name: string;
  icon: string | null;
  createdBy: string;
  creator: User;
  members: GroupMember[];
  expenses: GroupExpense[];
  createdAt: string;
  updatedAt: string;
}

export interface Balance {
  from: string;
  to: string;
  amount: number;
  description: string;
}

export interface GroupBalancesResponse {
  groupId: string;
  balances: Balance[];
  totalUnsettled: number;
}
