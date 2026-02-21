import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Wrench, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro no login');
            }

            login(data.user, data.token);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4 selection:bg-yellow-400 selection:text-zinc-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-zinc-800 rounded-3xl p-8 border border-zinc-700/50 shadow-2xl relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col items-center mb-8 relative z-10">
                        <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center text-zinc-900 shadow-lg shadow-yellow-400/20 mb-4">
                            <Wrench size={32} />
                        </div>
                        <h1 className="text-white font-black text-3xl tracking-tighter uppercase leading-none">Carlão</h1>
                        <span className="text-yellow-400 text-xs uppercase tracking-[0.3em] font-bold mt-1">Autopeças ERP</span>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl flex items-center gap-3 font-medium">
                                <ShieldAlert size={18} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Usuário</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                    placeholder="Nome de usuário"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 ml-1">Senha</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-900/50 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="yellow"
                            className="w-full py-4 text-sm mt-4 hover:scale-[1.02] active:scale-[0.98]"
                            disabled={loading}
                        >
                            <span className="font-black tracking-wide">
                                {loading ? 'AUTENTICANDO...' : 'ACESSAR SISTEMA'}
                            </span>
                        </Button>
                    </form>

                    <p className="text-center text-zinc-500 text-xs mt-8 font-medium">
                        Sistema Restrito • Carlão Autopeças © 2026
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
