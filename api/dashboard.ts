import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    const [
        { data: products },
        { data: lowStock },
        { data: recentSales },
        { data: income },
        { data: expense },
        { data: salesAgg }
    ] = await Promise.all([
        supabase.from('products').select('quantity, total_cost'),
        supabase.from('products').select('*').lte('quantity', 2).limit(5),
        supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('financial_transactions').select('amount').eq('type', 'INCOME'),
        supabase.from('financial_transactions').select('amount').eq('type', 'EXPENSE'),
        supabase.from('sales').select('total_value, margin')
    ]);

    const totalItems = (products || []).reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
    const inventoryValue = (products || []).reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.total_cost || 0)), 0);
    const totalIncome = (income || []).reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalExpense = (expense || []).reduce((sum: number, t: any) => sum + t.amount, 0);
    const totalRevenue = (salesAgg || []).reduce((sum: number, s: any) => sum + s.total_value, 0);
    const totalMargin = (salesAgg || []).reduce((sum: number, s: any) => sum + s.margin, 0);

    res.json({
        total_items: { count: totalItems },
        inventory_value: { value: inventoryValue },
        low_stock: lowStock || [],
        recent_sales: recentSales || [],
        financial_summary: { income: totalIncome, expense: totalExpense },
        top_products: [],
        total_revenue: totalRevenue,
        sales_count: (salesAgg || []).length,
        total_margin: totalMargin,
    });
}
