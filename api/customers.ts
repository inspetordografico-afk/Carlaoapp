import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    if (req.method === 'GET') {
        const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
    }

    if (req.method === 'POST') {
        const { name, document, phone, email, city, type, preferences, notes } = req.body;
        const { data, error } = await supabase.from('customers').insert({ name, document, phone, email, city, type, preferences: JSON.stringify(preferences || {}), notes }).select().single();
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ id: data.id });
    }

    if (req.method === 'PUT') {
        const id = req.query.id;
        if (!id) return res.status(400).json({ error: 'Missing customer id' });
        const { name, document, phone, email, city, type, preferences, notes } = req.body;
        const { error } = await supabase.from('customers').update({ name, document, phone, email, city, type, preferences: JSON.stringify(preferences || {}), notes, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
