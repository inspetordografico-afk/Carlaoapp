import { supabase, handleOptions } from './_supabase';

export default async function handler(req: any, res: any) {
    if (handleOptions(req, res)) return;

    const { data, error } = await supabase.from('sales').select('origin, total_value, margin');
    if (error) return res.status(500).json({ error: error.message });
    const grouped: Record<string, any> = {};
    for (const row of (data || [])) {
        const key = row.origin;
        if (!grouped[key]) grouped[key] = { origin: key, count: 0, revenue: 0, profit: 0 };
        grouped[key].count++;
        grouped[key].revenue += row.total_value;
        grouped[key].profit += row.margin;
    }
    res.json(Object.values(grouped));
}
