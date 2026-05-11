import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
    user: any | null;
    token: string | null;
    login: (user: any, token: string) => void;
    setAuth: (user: any, token: string) => void; // Alias for login to fix simple naming mismatch
    setUser: (user: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            login: (user, token) => {
                AsyncStorage.setItem('token', token);
                set({ user, token });
            },
            setAuth: (user, token) => {
                AsyncStorage.setItem('token', token);
                set({ user, token });
            },
            setUser: (user) => {
                set({ user });
            },
            logout: () => {
                AsyncStorage.removeItem('token');
                set({ user: null, token: null });
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
