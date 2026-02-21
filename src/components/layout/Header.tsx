import React from 'react';
import { Menu, Search, Bell, ArrowUpRight, PlusCircle, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../ui/Button';

interface HeaderProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onNewSale: () => void;
    onNewProduct: () => void;
    lowStockCount?: number;
}

export const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm, onNewSale, onNewProduct, lowStockCount }) => {
    const { setSidebarOpen, viewMode, setViewMode } = useAppStore();

    return (
        <header className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between sticky top-0 z-40">
            <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-3 -ml-2 text-zinc-500 hover:bg-zinc-100 rounded-lg"
            >
                <Menu size={26} />
            </button>

            <div className="flex-1 max-w-xl mx-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar peça, motor, código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-100 border-transparent focus:bg-white focus:ring-2 focus:ring-yellow-400 rounded-xl outline-none transition-all text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden md:flex bg-zinc-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('BALCAO')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'BALCAO' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>Balcão</button>
                    <button onClick={() => setViewMode('GESTAO')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${viewMode === 'GESTAO' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}>Gestão</button>
                </div>

                <Button
                    variant="red"
                    onClick={onNewSale}
                    className="flex items-center justify-center transition-transform hover:scale-105 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 shrink-0"
                >
                    <ArrowUpRight size={22} className="sm:mr-2" />
                    <span className="hidden sm:inline">Nova Venda</span>
                </Button>
                <Button
                    variant="yellow"
                    onClick={onNewProduct}
                    className="flex items-center justify-center transition-transform hover:scale-105 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 shrink-0"
                >
                    <PlusCircle size={22} className="sm:mr-2" />
                    <span className="hidden sm:inline">Nova Peça</span>
                </Button>

                <button className="p-3 text-zinc-500 hover:bg-zinc-100 rounded-lg relative">
                    <AlertTriangle size={24} />
                    {lowStockCount && lowStockCount > 0 ? (
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"></span>
                    ) : null}
                </button>
            </div>
        </header>
    );
};
