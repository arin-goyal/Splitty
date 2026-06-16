import { create } from 'zustand';
import api from '../services/api';
import { User } from '../types';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'denied';
  createdAt: string;
  sender: User;
}

interface FriendState {
  friends: User[];
  friendRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  addFriendVisible: boolean;
  requestsVisible: boolean;
  hasFetchedRequests: boolean;

  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  sendFriendRequest: (email: string) => Promise<{ success: boolean; message: string }>;
  respondToFriendRequest: (requestId: string, status: 'accepted' | 'denied') => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  clearError: () => void;
  setAddFriendVisible: (visible: boolean) => void;
  setRequestsVisible: (visible: boolean) => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  friendRequests: [],
  isLoading: false,
  error: null,
  addFriendVisible: false,
  requestsVisible: false,
  hasFetchedRequests: false,

  clearError: () => set({ error: null }),
  setAddFriendVisible: (visible) => set({ addFriendVisible: visible }),
  setRequestsVisible: (visible) => set({ requestsVisible: visible }),

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/friends');
      set({ friends: response.data, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch friends list';
      set({ error: message, isLoading: false });
    }
  },

  fetchFriendRequests: async () => {
    const isFirstFetch = !get().hasFetchedRequests;
    if (isFirstFetch) {
      set({ isLoading: true, error: null });
    } else {
      set({ error: null });
    }
    try {
      const response = await api.get('/friends/requests');
      set({ friendRequests: response.data, isLoading: false, hasFetchedRequests: true });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to fetch friend requests';
      set({ error: message, isLoading: false, hasFetchedRequests: true });
    }
  },

  sendFriendRequest: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/friends/request', { email });
      // If the request was auto-accepted because the other user already sent one,
      // refresh friends list.
      if (response.data.message && response.data.message.includes('accepted')) {
        await get().fetchFriends();
        set({ isLoading: false });
        return { success: true, message: 'You are now friends!' };
      }
      set({ isLoading: false });
      return { success: true, message: 'Friend request sent successfully!' };
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to send friend request';
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  respondToFriendRequest: async (requestId: string, status: 'accepted' | 'denied') => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/friends/requests/${requestId}`, { status });
      // Remove from pending list
      set((state) => ({
        friendRequests: state.friendRequests.filter((r) => r.id !== requestId),
      }));
      // If accepted, reload friends list
      if (status === 'accepted') {
        await get().fetchFriends();
      }
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to respond to friend request';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  removeFriend: async (friendId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/friends/${friendId}`);
      set((state) => ({
        friends: state.friends.filter((f) => f.id !== friendId),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to remove friend';
      set({ error: message, isLoading: false });
      return false;
    }
  },
}));
