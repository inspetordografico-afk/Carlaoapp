import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wrench, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { botEngine } from '../../services/botEngine';

export const StockAgent = () => {
    const { isChatOpen, setChatOpen } = useAppStore();
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || isChatLoading) return;

        const userMsg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsChatLoading(true);

        try {
            const response = await botEngine.processMessage(userMsg);
            setChatMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { role: 'model', text: 'Erro ao conectar aos dados reais. Tente novamente.' }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-zinc-900 text-yellow-400 rounded-full shadow-2xl flex items-center justify-center z-[70] hover:scale-110 transition-transform active:scale-95"
            >
                {isChatOpen ? <X size={24} /> : <Wrench size={24} />}
            </button>

            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 z-[70] flex flex-col overflow-hidden h-[500px]"
                    >
                        <div className="p-4 bg-zinc-900 text-white flex items-center gap-3">
                            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center text-zinc-900">
                                <Wrench size={18} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-tight">Assistente Carlão</h4>
                                <p className="text-[10px] text-yellow-400 font-bold uppercase">BOT DETERMINÍSTICO</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
                            {chatMessages.length === 0 && (
                                <div className="text-center py-10 space-y-2">
                                    <p className="text-sm font-bold text-zinc-400">Como posso ajudar hoje?</p>
                                    <p className="text-[10px] text-zinc-400 uppercase">Pergunte sobre faturamento, vendas,<br />peças em falta ou lucro.</p>
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                        ? 'bg-yellow-400 text-zinc-900 font-medium rounded-br-none'
                                        : 'bg-white border border-zinc-200 text-zinc-700 rounded-bl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-zinc-100 flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                placeholder="Ex: Qual o nosso lucro real?"
                                className="flex-1 px-3 py-2 bg-zinc-100 border-transparent focus:bg-white focus:ring-2 focus:ring-yellow-400 rounded-xl outline-none transition-all text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isChatLoading || !chatInput.trim()}
                                className="p-2 bg-zinc-900 text-yellow-400 rounded-xl disabled:opacity-50"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
