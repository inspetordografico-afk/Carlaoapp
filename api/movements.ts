import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { product_id, type, quantity, user_id, reason } = req.body;
    const { error: mvError } = await supabase.from('movements').insert({ product_id, type, quantity, user_id, reason });
    if (mvError) return res.status(400).json({ error: mvError.message });

    let updateData: any = {};
    if (type === 'ADJUST') {
        updateData = { quantity };
    } else {
        const { data: prod } = await supabase.from('products').select('quantity').eq('id', product_id).single();
        const change = type === 'IN' ? quantity : -quantity;
        updateData = { quantity: (prod?.quantity || 0) + change };
    }
    await supabase.from('products').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', product_id);
    res.json({ success: true });
}
