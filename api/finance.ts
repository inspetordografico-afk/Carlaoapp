import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    const { data, error } = await supabase.from('financial_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
}
