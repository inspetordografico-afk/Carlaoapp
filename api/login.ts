import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = 'https://ziwgdblrdpwhponnlyrk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd2dkYmxyZHB3aHBvbm5seXJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNDg2NSwiZXhwIjoyMDg3MjEwODY1fQ.qExMCvTtLlNekMFkMvCGC1PO9St37WeBkVHECYu76p8';
const JWT_SECRET = process.env.JWT_SECRET || 'carlao_erp_super_secret_key_2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, password } = req.body || {};
    if (!name || !password) {
        return res.status(400).json({ error: 'Name and password required' });
    }

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('name', name)
            .limit(1);

        if (error) return res.status(500).json({ error: 'DB error: ' + error.message });
        if (!users || users.length === 0) return res.status(401).json({ error: 'Usuário não encontrado' });

        const user = users[0];
        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
        const { password: _, ...userWithoutPassword } = user;

        return res.status(200).json({ token, user: userWithoutPassword });
    } catch (err: any) {
        return res.status(500).json({ error: 'Unhandled: ' + err.message });
    }
}
