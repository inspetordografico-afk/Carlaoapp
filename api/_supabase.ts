import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ziwgdblrdpwhponnlyrk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd2dkYmxyZHB3aHBvbm5seXJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNDg2NSwiZXhwIjoyMDg3MjEwODY1fQ.qExMCvTtLlNekMFkMvCGC1PO9St37WeBkVHECYu76p8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export function cors(res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req: any, res: any): boolean {
    if (req.method === 'OPTIONS') {
        cors(res);
        res.status(200).end();
        return true;
    }
    cors(res);
    return false;
}
