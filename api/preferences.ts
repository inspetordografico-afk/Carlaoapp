import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    if (req.method === 'GET') {
        const userId = req.query.userId;
        const module = req.query.module;
        if (!userId || !module) return res.status(400).json({ error: 'Missing userId or module' });
        const { data } = await supabase.from('user_preferences').select('*').eq('user_id', userId).eq('module', module).single();
        return res.json(data || { config: '{}' });
    }

    if (req.method === 'POST') {
        const { user_id, module, config } = req.body;
        const { error } = await supabase.from('user_preferences').upsert({ user_id, module, config: JSON.stringify(config), updated_at: new Date().toISOString() }, { onConflict: 'user_id,module' });
        if (error) return res.status(400).json({ error: error.message });
        return res.json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
}
