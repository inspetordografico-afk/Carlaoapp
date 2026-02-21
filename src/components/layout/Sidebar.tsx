import React from 'react';
import {
    Users,
    Settings2,
    Package,
    FileText,
    ArrowUpRight,
    User as UserIcon,
    LogOut,
    LayoutDashboard,
    Wrench,
    BarChart3
} from 'lucide-react';
import { useAppStore, TabId } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

const NavItem = ({ id, icon: Icon, label }: { id: TabId, icon: any, label: string }) => {
    const { activeTab, setActiveTab, setSidebarOpen } = useAppStore();

    return (
        <button
            onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-bold ${activeTab === id
                ? 'bg-yellow-400 text-zinc-900 shadow-md translate-x-2'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 hover:translate-x-1'
                }`}
        >
            <Icon size={20} />
            <span>{label}</span>
            {activeTab === id && (
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-900 ml-auto" />
            )}
        </button>
    );
};

export const Sidebar = () => {
    const { isSidebarOpen, setSidebarOpen } = useAppStore();
    const { user: currentUser, logout } = useAuthStore();

    return (
        <>
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`fixed lg:static top-0 left-0 h-full w-72 bg-zinc-900 text-zinc-400 flex flex-col transition-transform duration-300 z-50 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-zinc-900 shadow-lg shadow-yellow-400/20">
                                <Wrench size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <h1 className="text-white font-black text-xl tracking-tighter uppercase leading-none">Carlão</h1>
                                <span className="text-yellow-400 text-[10px] uppercase tracking-[0.2em] font-bold">Autopeças ERP</span>
                            </div>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg text-white">
                            ✕
                        </button>
                    </div>

                    <nav className="flex flex-col gap-2 flex-1">
                        <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                        <NavItem id="inventory" icon={Package} label="Estoque" />
                        <NavItem id="sales" icon={ArrowUpRight} label="Vendas" />
                        <NavItem id="customers" icon={Users} label="Clientes" />
                        <NavItem id="finance" icon={FileText} label="Financeiro" />
                        <NavItem id="fiscal" icon={FileText} label="Fiscal" />
                        <NavItem id="warranty" icon={Wrench} label="Garantia" />
                        <NavItem id="marketing" icon={LayoutDashboard} label="Marketing" />
                        <NavItem id="bi" icon={BarChart3} label="BI & IA" />
                    </nav>
                </div>

                <div className="mt-auto p-6">
                    <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white border-2 border-zinc-600">
                                <UserIcon size={20} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-bold">{currentUser?.name}</p>
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wider">{currentUser?.role === 'OWNER' ? 'Administrador' : 'Balcão'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => alert('Configurações em breve...')} className="flex-1 py-2 bg-zinc-700/50 hover:bg-zinc-700 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2">
                                <Settings2 size={14} /> Config
                            </button>
                            <button onClick={() => { logout(); window.location.reload(); }} className="py-2 px-4 rounded-xl text-xs font-bold text-red-400 hover:text-white hover:bg-red-500/20 transition-colors">
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
