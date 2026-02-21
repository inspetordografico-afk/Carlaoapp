import { Product, DashboardStats, Transaction } from '../types';

const API_BASE = '/api';

export const apiService = {
    // PRODUCTS
    getProducts: async (): Promise<Product[]> => {
        const res = await fetch(`${API_BASE}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },
    saveProduct: async (productData: any, isUpdate = false, id?: number) => {
        const method = isUpdate ? 'PUT' : 'POST';
        const url = isUpdate ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        if (!res.ok) throw new Error('Failed to save product');
        return res.json();
    },

    // DASHBOARD & STATS
    getDashboardStats: async (): Promise<DashboardStats> => {
        const res = await fetch(`${API_BASE}/dashboard`);
        if (!res.ok) throw new Error('Failed to fetch dashboard stats');
        return res.json();
    },
    getMarketingStats: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/marketing/stats`);
        if (!res.ok) throw new Error('Failed to fetch marketing stats');
        return res.json();
    },

    // FINANCE & TRANSACTIONS
    getTransactions: async (): Promise<Transaction[]> => {
        const res = await fetch(`${API_BASE}/finance/transactions`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    },

    // CUSTOMERS
    getCustomers: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/customers`);
        if (!res.ok) throw new Error('Failed to fetch customers');
        return res.json();
    },

    // SALES
    createSale: async (saleData: any) => {
        const res = await fetch(`${API_BASE}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
        if (!res.ok) throw new Error('Failed to create sale');
        return res.json();
    },

    // USER PREFERENCES
    getUserPreferences: async (userId: number, key: string) => {
        const res = await fetch(`${API_BASE}/user_preferences/${userId}/${key}`);
        if (!res.ok) throw new Error('Failed to fetch user preferences');
        return res.json();
    },
    saveUserPreferences: async (userId: number, key: string, config: any) => {
        const res = await fetch(`${API_BASE}/user_preferences`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, module: key, config })
        });
        if (!res.ok) throw new Error('Failed to save preferences');
        return res.json();
    }
};
