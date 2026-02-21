import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    const { data, error } = await supabase.from('products').select('*').order('quantity', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}
