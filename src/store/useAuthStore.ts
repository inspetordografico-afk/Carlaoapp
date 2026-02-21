import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: { id: 1, name: 'Carlão', role: 'OWNER' } as any,
            token: 'bypass',
            isAuthenticated: true,
            login: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => {
                set({ user: { id: 1, name: 'Carlão', role: 'OWNER' } as any, token: 'bypass', isAuthenticated: true });
            },
        }),
        {
            name: 'carlao-auth-storage', // saves to localStorage
        }
    )
);
