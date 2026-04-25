import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setUser: (user, token) => {
    set({ user, token });
  },

  logout: async () => {
    await AsyncStorage.clear();
    set({ user: null, token: null });
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        set({ user: JSON.parse(userStr), token, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;