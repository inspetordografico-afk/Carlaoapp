import { Product, DashboardStats, Transaction, Sale } from '../types';

/**
 * Data Access Layer (Service / Repository)
 * 
 * LOCAL FIRST ARCHITECTURE:
 * Currently, all calls point to the local Express server running better-sqlite3.
 * Data is persisted locally in the 'estoque_v3.db' file.
 * 
 * CLOUD PREPARATION (VERCEL):
 * In the future, this file will simply be swapped to point to the production
 * URL or a Serverless Adapter (like Next.js Server Actions connecting to Vercel Postgres),
 * without changing the rest of the React application's business logic.
 */

import { useAuthStore } from '../store/useAuthStore';

const API_BASE = '/api';

const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = useAuthStore.getState().token;
    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.reload();
    }

    return response;
};

export const apiService = {
    // PRODUCTS
    getProducts: async (): Promise<Product[]> => {
        const res = await authFetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },
    saveProduct: async (productData: any, isUpdate = false, id?: number) => {
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
        const res = await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!res.ok) throw new Error('Failed to save product');
        return res.json();
    },

    // DASHBOARD & STATS
    getDashboardStats: async (): Promise<DashboardStats> => {
        const res = await authFetch(`${API_BASE}/dashboard`);
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
    },
    getMarketingStats: async (): Promise<any[]> => {
        const res = await authFetch(`${API_BASE}/marketing/stats`);
        if (!res.ok) throw new Error('Failed to fetch marketing stats');
        return res.json();
    },

    // FINANCE & TRANSACTIONS
    getTransactions: async (): Promise<Transaction[]> => {
        const res = await authFetch(`${API_BASE}/finance/transactions`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    },

    // CUSTOMERS
    getCustomers: async (): Promise<any[]> => {
        const res = await authFetch(`${API_BASE}/customers`);
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
    },

    // SALES
    createSale: async (saleData: any) => {
        const res = await authFetch(`${API_BASE}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
        if (!res.ok) throw new Error('Failed to create sale');
        return res.json();
    },

    // USER PREFERENCES
    getUserPreferences: async (userId: number, key: string) => {
        const res = await authFetch(`${API_BASE}/user_preferences/${userId}/${key}`);
        if (!res.ok) throw new Error('Failed to fetch user preferences');
        return res.json();
    },
    saveUserPreferences: async (userId: number, key: string, config: any) => {
        const res = await authFetch(`${API_BASE}/user_preferences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, preference_key: key, config_json: JSON.stringify(config) })
        });
        if (!res.ok) throw new Error('Failed to save preferences');
        return res.json();
    }
};
