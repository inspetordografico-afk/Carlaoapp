import { supabase, handleOptions } from './_supabase';

// Convert empty strings to null for fields with UNIQUE constraints
function sanitizeProduct(body: any) {
    const NULLABLE_UNIQUE = ['internal_code', 'manufacturer_code'];
    const out = { ...body };
    for (const key of NULLABLE_UNIQUE) {
        if (out[key] === '' || out[key] === undefined) out[key] = null;
    }
    return out;
}

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    if (req.method === 'GET') {
        const id = req.query.id;
        if (id) {
            const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
            if (error) return res.status(404).json({ error: error.message });
            return res.json(data);
        }
        const { data, error } = await supabase.from('products').select('*').order('updated_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
    }

    if (req.method === 'POST') {
        const body = sanitizeProduct(req.body);
        const total_cost = (body.acquisition_cost || 0) + (body.trade_in_value || 0) + (body.logistics_cost || 0) + (body.rectification_cost || 0);
        const { data, error } = await supabase.from('products').insert({ ...body, total_cost }).select().single();
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ id: data.id });
    }

    if (req.method === 'PUT') {
        const id = req.query.id;
        if (!id) return res.status(400).json({ error: 'Missing product id' });
        const body = sanitizeProduct(req.body);
        const total_cost = (body.acquisition_cost || 0) + (body.trade_in_value || 0) + (body.logistics_cost || 0) + (body.rectification_cost || 0);
        const { error } = await supabase.from('products').update({ ...body, total_cost, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
