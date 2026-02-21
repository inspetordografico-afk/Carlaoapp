import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
    }

    if (req.method === 'POST') {
        const { user_id, customer_name, customer_document, items, origin, trade_ins, discount_value } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ error: 'No items' });

        let totalValue = 0, totalCost = 0, tradeInTotal = 0;
        if (trade_ins?.length > 0) trade_ins.forEach((ti: any) => { tradeInTotal += ti.estimated_value; });
        items.forEach((item: any) => { totalValue += item.unit_price * item.quantity; totalCost += item.unit_cost * item.quantity; });

        const finalValue = totalValue - (discount_value || 0) - tradeInTotal;
        const margin = finalValue - totalCost;

        const { data: sale, error: saleError } = await supabase.from('sales').insert({
            user_id: user_id || 1, customer_name, customer_document, total_value: finalValue, total_cost: totalCost, margin,
            origin: origin || 'DIRECT', warranty_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }).select().single();
        if (saleError) return res.status(400).json({ error: saleError.message });

        for (const item of items) {
            await supabase.from('sale_items').insert({ sale_id: sale.id, product_id: item.product_id, service_name: item.service_name, quantity: item.quantity, unit_price: item.unit_price, unit_cost: item.unit_cost, type: item.type });
            if (item.type === 'PRODUCT' && item.product_id) {
                const { data: prod } = await supabase.from('products').select('quantity').eq('id', item.product_id).single();
                await supabase.from('products').update({ quantity: (prod?.quantity || 0) - item.quantity, updated_at: new Date().toISOString() }).eq('id', item.product_id);
            }
        }

        if (trade_ins?.length > 0) {
            for (const ti of trade_ins) {
                await supabase.from('trade_ins').insert({ sale_id: sale.id, description: ti.description, estimated_value: ti.estimated_value, condition: ti.condition });
            }
        }

        await supabase.from('financial_transactions').insert({ type: 'INCOME', category: 'SALE', amount: finalValue, description: `Venda #${sale.id} - ${customer_name || 'Consumidor'}`, sale_id: sale.id });
        return res.json({ id: sale.id });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
