import { create } from 'zustand';
import type { User, Product } from '../types';

export type TabId = 'dashboard' | 'inventory' | 'sales' | 'finance' | 'marketing' | 'bi' | 'fiscal' | 'warranty' | 'customers';
export type ViewMode = 'BALCAO' | 'GESTAO';

interface AppState {
    // Global Settings
    currentUser: User;
    viewMode: ViewMode;
    activeTab: TabId;
    isSidebarOpen: boolean;

    // Modals
    isProductModalOpen: boolean;
    isSaleModalOpen: boolean;
    isChatOpen: boolean;
    selectedProduct: Product | null;

    // Actions
    setViewMode: (mode: ViewMode) => void;
    setActiveTab: (tab: TabId) => void;
    setSidebarOpen: (isOpen: boolean) => void;
    setProductModalOpen: (isOpen: boolean, product?: Product | null) => void;
    setSaleModalOpen: (isOpen: boolean) => void;
    setChatOpen: (isOpen: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentUser: { id: 1, name: 'Carlão', role: 'OWNER' },
    viewMode: 'BALCAO',
    activeTab: 'dashboard',
    isSidebarOpen: false,

    isProductModalOpen: false,
    isSaleModalOpen: false,
    isChatOpen: false,
    selectedProduct: null,

    setViewMode: (mode) => set({ viewMode: mode }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    setProductModalOpen: (isOpen, product = null) => set({ isProductModalOpen: isOpen, selectedProduct: product }),
    setSaleModalOpen: (isOpen) => set({ isSaleModalOpen: isOpen }),
    setChatOpen: (isOpen) => set({ isChatOpen: isOpen }),
}));
