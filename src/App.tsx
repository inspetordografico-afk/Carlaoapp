/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  AlertTriangle,
  History,
  FileText,
  Settings,
  Menu,
  X,
  ChevronRight,
  Filter,
  Camera,
  Save,
  Trash2,
  User as UserIcon,
  LogOut,
  Wrench,
  Users,
  Settings2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Product, DashboardStats, User, Transaction, SaleOrigin, Sale } from './types';
import { useAppStore } from './store/useAppStore';
import { apiService } from './services/api';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './components/auth/Login';
import { useAuthStore } from './store/useAuthStore';
import { StockAgent } from './components/chat/StockAgent';

// --- Main App ---

export default function App() {
  const {
    activeTab,
    viewMode,
    isSidebarOpen,
    isProductModalOpen,
    isSaleModalOpen,
    selectedProduct,
    isChatOpen,
    setSidebarOpen,
    setProductModalOpen,
    setSaleModalOpen,
    setChatOpen,
    setActiveTab,
    setViewMode
  } = useAppStore();

  const { isAuthenticated, user: currentUser, logout } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marketingStats, setMarketingStats] = useState<any[]>([]);
  const [userPreferences, setUserPreferences] = useState<any>({});

  const [sales, setSales] = useState<Sale[]>([]);
  const [tradeInItems, setTradeInItems] = useState<any[]>([]);
  const [customerDocument, setCustomerDocument] = useState('');
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [saleOrigin, setSaleOrigin] = useState<SaleOrigin>('DIRECT');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [saleItems, setSaleItems] = useState<any[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterEngine, setFilterEngine] = useState('');

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [prodData, statsData, transData, markData, custData, prefData] = await Promise.all([
        apiService.getProducts(),
        apiService.getDashboardStats(),
        apiService.getTransactions(),
        apiService.getMarketingStats(),
        apiService.getCustomers(),
        apiService.getUserPreferences(currentUser.id, 'PRODUCTS_FORM')
      ]);

      setProducts(prodData);
      setStats(statsData);
      setTransactions(transData);
      setMarketingStats(markData);
      setCustomers(custData || []);

      const configObj = prefData?.config ? JSON.parse(prefData.config) : {};
      setUserPreferences({
        PRODUCTS_FORM: Object.keys(configObj).length > 0 ? configObj : {
          type: true, engine: true, brand: true, model: true, year_range: true, internal_code: true,
          manufacturer_code: true, condition: true, acquisition_cost: true, trade_in_value: true,
          logistics_cost: true, rectification_cost: true, sale_price: true, min_price: true,
          markup: true, warranty_days: true, status: true, quantity: true, min_quantity: true,
          location: true, measurements: true, notes: true, photo_url: true
        }
      });

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if authenticated
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.engine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.internal_code?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !filterType || p.type === filterType;
      const matchesEngine = !filterEngine || p.engine === filterEngine;

      return matchesSearch && matchesType && matchesEngine;
    });
  }, [products, searchTerm, filterType, filterEngine]);

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Convert numeric fields
    const numericFields = [
      'quantity', 'min_quantity', 'acquisition_cost', 'trade_in_value',
      'logistics_cost', 'rectification_cost', 'sale_price', 'min_price',
      'markup', 'suggested_price', 'warranty_days'
    ];
    numericFields.forEach(field => {
      if (data[field]) data[field] = Number(data[field]) as any;
    });

    try {
      await apiService.saveProduct(data, !!selectedProduct, selectedProduct?.id);
      setProductModalOpen(false, null);
      fetchData();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleMovement = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Movement logic replaced by Sales and Inventory adjustments
  };

  const openMovementModal = (product: Product, type: 'IN' | 'OUT' | 'ADJUST') => {
    setProductModalOpen(true, product);
    // Movement logic replaced by Sales and Inventory adjustments
  };

  const openEditModal = (product: Product) => {
    setProductModalOpen(true, product);
  };


  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans">
      {/* Sidebar */}
      <Sidebar />
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onNewSale={() => { setSaleItems([]); setCustomerName(''); setDiscountPercent(0); setTradeInItems([]); setSaleModalOpen(true); }}
          onNewProduct={() => { setProductModalOpen(true, null); }}
          lowStockCount={stats?.low_stock?.length || 0}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-5 flex items-center gap-4 border-l-4 border-l-yellow-400">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                      <Package size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor em Estoque</p>
                      <p className="text-2xl font-black">R$ {stats?.inventory_value.value?.toLocaleString() || 0}</p>
                    </div>
                  </Card>
                  <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-600">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                      <ArrowUpRight size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vendas (Mês)</p>
                      <p className="text-2xl font-black">R$ {stats?.financial_summary.income?.toLocaleString() || 0}</p>
                    </div>
                  </Card>
                  <Card className="p-5 flex items-center gap-4 border-l-4 border-l-emerald-600">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <FileText size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lucro Bruto (Mês)</p>
                      <p className="text-2xl font-black">R$ {(stats?.financial_summary.income - stats?.financial_summary.expense)?.toLocaleString() || 0}</p>
                    </div>
                  </Card>
                  <Card className="p-5 flex items-center gap-4 border-l-4 border-l-zinc-900">
                    <div className="p-3 bg-zinc-100 text-zinc-900 rounded-xl">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque Baixo</p>
                      <p className="text-2xl font-black">{stats?.low_stock.length || 0}</p>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Recent Sales */}
                  <Card className="lg:col-span-2">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                      <h3 className="font-black uppercase text-sm tracking-tight">Últimas Vendas</h3>
                      <button onClick={() => setActiveTab('sales')} className="text-xs font-bold text-yellow-600 hover:underline">Ver tudo</button>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {stats?.recent_sales.map((s) => (
                        <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <ArrowUpRight size={18} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold">Venda #{s.id} - {s.customer_name || 'Consumidor'}</p>
                            <p className="text-xs text-zinc-500">{s.origin} • {new Date(s.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">R$ {s.total_value.toLocaleString()}</p>
                            <p className="text-[10px] text-zinc-400 uppercase">Margem: R$ {s.margin.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Top Products */}
                  <Card>
                    <div className="p-4 border-b border-zinc-100">
                      <h3 className="font-black uppercase text-sm tracking-tight">Mais Vendidos</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {stats?.top_products.map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center font-black text-zinc-400 text-xs">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold">{p.type} {p.engine}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">{p.sales_count} vendas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Estoque de Peças</h2>
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-yellow-400 outline-none bg-white">
                    <option value="">Todos os tipos</option>
                    <option value="Cabeçote">Cabeçote</option>
                    <option value="Virabrequim">Virabrequim</option>
                    <option value="Biela">Biela</option>
                    <option value="Bronzina">Bronzina</option>
                    <option value="Comando">Comando</option>
                    <option value="Junta">Junta</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold">
                          <th className="px-4 py-3">Tipo</th>
                          <th className="px-4 py-3">Motor</th>
                          <th className="px-4 py-3">Marca / Modelo</th>
                          <th className="px-4 py-3">Ano</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3 text-center">Qtd</th>
                          <th className="px-4 py-3 text-right">Custo</th>
                          <th className="px-4 py-3 text-right">Preço Venda</th>
                          <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredProducts.length === 0 ? (
                          <tr><td colSpan={9} className="px-4 py-12 text-center text-zinc-400 text-sm">Nenhuma peça encontrada. Use o botão "Nova Peça" para cadastrar.</td></tr>
                        ) : filteredProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-4 py-3"><span className="text-xs font-bold bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded">{p.type}</span></td>
                            <td className="px-4 py-3 text-sm font-bold">{p.engine || '—'}</td>
                            <td className="px-4 py-3 text-sm">{p.brand} {p.model}</td>
                            <td className="px-4 py-3 text-xs text-zinc-500">{p.year_range || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${p.condition === 'Nova' ? 'bg-emerald-100 text-emerald-700' : p.condition === 'Retificada' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>
                                {p.condition || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-black text-sm ${(p.quantity || 0) <= (p.min_quantity || 2) ? 'text-red-600' : 'text-zinc-900'}`}>{p.quantity ?? 0}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-zinc-500">R$ {(p.total_cost || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-sm font-black text-emerald-600">R$ {(p.sale_price || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-center">
                              <button onClick={() => openEditModal(p)} className="text-xs font-bold text-yellow-600 hover:underline px-2 py-1 rounded hover:bg-yellow-50">Editar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'fiscal' && (
              <motion.div key="fiscal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight uppercase">Gestão Fiscal (NF-e)</h2>
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold">
                          <th className="px-6 py-4">Venda</th>
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Documento</th>
                          <th className="px-6 py-4">Valor</th>
                          <th className="px-6 py-4">Status Fiscal</th>
                          <th className="px-6 py-4">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {stats?.recent_sales.map(s => (
                          <tr key={s.id} className="hover:bg-zinc-50">
                            <td className="px-6 py-4 text-xs font-bold">#{s.id}</td>
                            <td className="px-6 py-4 text-sm font-bold">{s.customer_name || 'Consumidor'}</td>
                            <td className="px-6 py-4 text-xs">{s.customer_document || 'N/A'}</td>
                            <td className="px-6 py-4 text-sm font-black">R$ {s.total_value.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.fiscal_status === 'ISSUED' ? 'bg-emerald-100 text-emerald-700' :
                                s.fiscal_status === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-700'
                                }`}>
                                {s.fiscal_status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="secondary" className="text-[10px] py-1">Emitir NF-e</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'warranty' && (
              <motion.div key="warranty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight uppercase">Garantias e Pós-Venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-5 border-l-4 border-l-yellow-400">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Garantias Ativas</p>
                    <p className="text-2xl font-black">24</p>
                  </Card>
                  <Card className="p-5 border-l-4 border-l-red-600">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Devoluções (Mês)</p>
                    <p className="text-2xl font-black">2</p>
                  </Card>
                  <Card className="p-5 border-l-4 border-l-zinc-900">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Impacto Financeiro</p>
                    <p className="text-2xl font-black text-red-600">R$ 1.200</p>
                  </Card>
                </div>
                <Card>
                  <div className="p-4 border-b border-zinc-100">
                    <h3 className="font-black uppercase text-sm tracking-tight">Vendas com Garantia</h3>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {stats?.recent_sales.map(s => (
                      <div key={s.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">Venda #{s.id} - {s.customer_name}</p>
                          <p className="text-xs text-zinc-500 uppercase">Garantia até: {s.warranty_until ? new Date(s.warranty_until).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <Button variant="secondary" className="text-[10px] py-1">Registrar Retorno</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
            {activeTab === 'sales' && (
              <motion.div key="sales" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Vendas e Pedidos</h2>
                  <Button variant="red" onClick={() => { setSaleItems([]); setCustomerName(''); setSaleModalOpen(true); }}>
                    <PlusCircle size={18} />
                    <span>Nova Venda</span>
                  </Button>
                </div>
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold">
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Cliente</th>
                          <th className="px-6 py-4">Valor</th>
                          <th className="px-6 py-4">Margem</th>
                          <th className="px-6 py-4">Origem</th>
                          <th className="px-6 py-4">Data</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {stats?.recent_sales.map(s => (
                          <tr key={s.id} className="hover:bg-zinc-50">
                            <td className="px-6 py-4 text-xs font-bold">#{s.id}</td>
                            <td className="px-6 py-4 text-sm font-bold">{s.customer_name || 'Consumidor'}</td>
                            <td className="px-6 py-4 text-sm font-black text-emerald-600">R$ {s.total_value.toLocaleString()}</td>
                            <td className="px-6 py-4 text-sm font-bold text-zinc-600">R$ {s.margin.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold uppercase">{s.origin}</span>
                            </td>
                            <td className="px-6 py-4 text-xs text-zinc-500">{new Date(s.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'customers' && (
              <motion.div key="customers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight uppercase">Gestão de Clientes (CRM)</h2>
                  <Button variant="red" onClick={() => { /* open modal */ }}>
                    <PlusCircle size={18} />
                    <span>Novo Cliente</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="p-5 border-l-4 border-l-yellow-400">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Total de Clientes</p>
                    <p className="text-2xl font-black">{customers.length}</p>
                  </Card>
                  <Card className="p-5 border-l-4 border-l-emerald-600">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Ticket Médio Geral</p>
                    <p className="text-2xl font-black text-emerald-600">
                      R$ {sales.length > 0 ? (sales.reduce((acc, s) => acc + s.total_value, 0) / sales.length).toLocaleString() : 0}
                    </p>
                  </Card>
                  <Card className="p-5 border-l-4 border-l-zinc-900">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Frotas / Oficinas</p>
                    <p className="text-2xl font-black">{customers.filter(c => c.type === 'OFICINA' || c.type === 'FROTA').length}</p>
                  </Card>
                </div>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-900 text-white text-[10px] uppercase tracking-widest font-bold">
                          <th className="px-6 py-4">Nome / Razão Social</th>
                          <th className="px-6 py-4">Tipo</th>
                          <th className="px-6 py-4">Contato</th>
                          {viewMode === 'GESTAO' && <th className="px-6 py-4">LTV (Compras)</th>}
                          <th className="px-6 py-4">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {customers.map(c => {
                          const cSales = sales.filter(s => s.customer_name === c.name || s.customer_document === c.document);
                          const totalLtv = cSales.reduce((acc, s) => acc + s.total_value, 0);

                          return (
                            <tr key={c.id} className="hover:bg-zinc-50">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold">{c.name}</p>
                                <p className="text-xs text-zinc-500">{c.document || 'Sem Documento'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-[10px] font-bold uppercase">{c.type}</span>
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <p>{c.phone}</p>
                                <p className="text-zinc-500 truncate max-w-[150px]">{c.email}</p>
                              </td>
                              {viewMode === 'GESTAO' && (
                                <td className="px-6 py-4">
                                  <p className="text-sm font-black text-emerald-600">R$ {totalLtv.toLocaleString()}</p>
                                  <p className="text-[10px] text-zinc-400 uppercase">{cSales.length} compras</p>
                                </td>
                              )}
                              <td className="px-6 py-4">
                                <Button variant="secondary" className="text-[10px] py-1">Ver Ficha</Button>
                              </td>
                            </tr>
                          );
                        })}
                        {customers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 font-bold text-sm">
                              Nenhum cliente cadastrado ainda.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'finance' && (
              <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight uppercase">Fluxo de Caixa</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="font-black text-lg mb-4 uppercase">Resumo Mensal</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-500 uppercase">Entradas</span>
                        <span className="text-lg font-black text-emerald-600">R$ {stats?.financial_summary.income?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-zinc-500 uppercase">Saídas</span>
                        <span className="text-lg font-black text-red-600">R$ {stats?.financial_summary.expense?.toLocaleString() || 0}</span>
                      </div>
                      <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                        <span className="text-sm font-black uppercase">Saldo</span>
                        <span className="text-2xl font-black">R$ {(stats?.financial_summary.income - stats?.financial_summary.expense)?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <h3 className="font-black text-lg mb-4 uppercase">Últimas Transações</h3>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg">
                          <div>
                            <p className="text-xs font-bold uppercase">{t.description}</p>
                            <p className="text-[10px] text-zinc-400 uppercase">{t.category}</p>
                          </div>
                          <span className={`text-sm font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {t.type === 'INCOME' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === 'marketing' && (
              <motion.div key="marketing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight uppercase">Marketing e ROI</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {marketingStats.map((ms, i) => (
                    <Card key={i} className="p-5">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{ms.origin}</p>
                      <p className="text-xl font-black">R$ {ms.revenue.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">Lucro: R$ {ms.profit.toLocaleString()}</p>
                    </Card>
                  ))}
                </div>
                <Card className="p-6">
                  <h3 className="font-black text-lg mb-4 uppercase">Sugestões de SEO Local</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Palavra-chave sugerida</p>
                      <p className="text-sm font-black">"Cabeçote AP 1.6 retificado em São Paulo"</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Baseado em: Alto giro e estoque disponível</p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Anúncio sugerido</p>
                      <p className="text-sm font-black">"Virabrequim MWM em promoção - Carlão Autopeças"</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Baseado em: Peça parada há mais de 60 dias</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'bi' && (
              <motion.div key="bi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-black tracking-tight uppercase">Inteligência de Negócio & IA</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-zinc-900 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-yellow-400 text-zinc-900 rounded-lg">
                        <AlertTriangle size={20} />
                      </div>
                      <h3 className="font-black text-lg uppercase">Copiloto de Decisões (IA 2026)</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                        <p className="text-sm font-bold text-yellow-400">Previsão de Demanda</p>
                        <p className="text-xs text-zinc-300 mt-1">Alta probabilidade de procura por Cabeçotes AP 1.6 nas próximas 2 semanas (Sazonalidade Detectada).</p>
                      </div>
                      <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                        <p className="text-sm font-bold text-emerald-400">Sugestão de Precificação</p>
                        <p className="text-xs text-zinc-300 mt-1">Virabrequim MWM (ID: 42) está com margem 15% acima do mercado. Sugerimos ajuste para R$ 2.450 para acelerar giro.</p>
                      </div>
                      <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                        <p className="text-sm font-bold text-red-400">Detecção de Estoque Morto</p>
                        <p className="text-xs text-zinc-300 mt-1">Bielas Fire 1.0 (Usadas) sem movimentação há 120 dias. Recomendamos liquidação ou descarte.</p>
                      </div>
                    </div>
                  </Card>
                  <div className="space-y-6">
                    <Card className="p-6">
                      <h3 className="font-black text-lg mb-4 uppercase">Performance por Categoria</h3>
                      <div className="space-y-4">
                        {stats?.top_products.map((p, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-xs font-bold uppercase mb-1">
                              <span>{p.engine}</span>
                              <span className="text-emerald-600">Margem: 32%</span>
                            </div>
                            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-600" style={{ width: `${(p.sales_count / 10) * 100}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                    <Card className="p-6">
                      <h3 className="font-black text-lg mb-4 uppercase">ROI de Marketing</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase">Google Ads</span>
                          <span className="text-sm font-black text-emerald-600">ROI: 4.2x</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase">Meta Ads</span>
                          <span className="text-sm font-black text-emerald-600">ROI: 3.8x</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductModalOpen(false, null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-zinc-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">
                    {selectedProduct ? 'Editar Peça' : 'Cadastrar Nova Peça'}
                  </h3>
                  <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest">
                    {userPreferences.PRODUCTS_FORM?.logistics_cost === false ? 'Modo Balcão Simplificado (Campos Ocultos Preservados)' : 'Preencha os dados técnicos'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const newConfig = {
                        ...userPreferences.PRODUCTS_FORM,
                        logistics_cost: !userPreferences.PRODUCTS_FORM?.logistics_cost,
                        rectification_cost: !userPreferences.PRODUCTS_FORM?.logistics_cost,
                        min_price: !userPreferences.PRODUCTS_FORM?.logistics_cost,
                        internal_code: !userPreferences.PRODUCTS_FORM?.logistics_cost
                      };
                      setUserPreferences(prev => ({ ...prev, PRODUCTS_FORM: newConfig }));

                      // Save visually via toast or silent API call
                      await fetch('/api/user_preferences', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: currentUser.id, module: 'PRODUCTS_FORM', config: newConfig })
                      });
                    }}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold uppercase ${userPreferences.PRODUCTS_FORM?.logistics_cost === false ? 'bg-yellow-400 text-zinc-900 shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                  >
                    <Settings2 size={18} />
                    <span className="hidden sm:inline">Layout Gestor</span>
                  </button>
                  <button onClick={() => setProductModalOpen(false, null)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userPreferences.PRODUCTS_FORM?.type !== false && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tipo de Peça*</label>
                      <select name="type" defaultValue={selectedProduct?.type} required className="px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-yellow-400 outline-none bg-white">
                        <option value="Cabeçote">Cabeçote</option>
                        <option value="Virabrequim">Virabrequim</option>
                        <option value="Biela">Biela</option>
                        <option value="Bronzina">Bronzina</option>
                        <option value="Comando">Comando</option>
                        <option value="Junta">Junta</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  )}
                  {userPreferences.PRODUCTS_FORM?.engine !== false && <Input label="Motor (ex: AP 1.6, Fire 1.0)*" name="engine" defaultValue={selectedProduct?.engine} required />}
                  {userPreferences.PRODUCTS_FORM?.brand !== false && <Input label="Marca do Veículo*" name="brand" defaultValue={selectedProduct?.brand} required />}
                  {userPreferences.PRODUCTS_FORM?.model !== false && <Input label="Modelo do Veículo*" name="model" defaultValue={selectedProduct?.model} required />}
                  {userPreferences.PRODUCTS_FORM?.year_range !== false && <Input label="Ano / Faixa de Anos" name="year_range" defaultValue={selectedProduct?.year_range} placeholder="Ex: 2010-2015" />}
                  {userPreferences.PRODUCTS_FORM?.internal_code !== false && <Input label="Código Interno" name="internal_code" defaultValue={selectedProduct?.internal_code} />}
                  {userPreferences.PRODUCTS_FORM?.manufacturer_code !== false && <Input label="Código Fabricante" name="manufacturer_code" defaultValue={selectedProduct?.manufacturer_code} />}

                  {userPreferences.PRODUCTS_FORM?.condition !== false && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Estado da Peça*</label>
                      <select name="condition" defaultValue={selectedProduct?.condition} required className="px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-yellow-400 outline-none bg-white">
                        <option value="Nova">Nova</option>
                        <option value="Usada">Usada</option>
                        <option value="Retificada">Retificada</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-100 pt-4 col-span-1 sm:col-span-2">
                    <div className="space-y-4">
                      {userPreferences.PRODUCTS_FORM?.acquisition_cost !== false && <h4 className="text-xs font-black uppercase text-zinc-400">Dados de Custo</h4>}
                      {userPreferences.PRODUCTS_FORM?.acquisition_cost !== false && <Input label="Custo Aquisição" name="acquisition_cost" type="number" defaultValue={selectedProduct?.acquisition_cost || 0} />}
                      {userPreferences.PRODUCTS_FORM?.trade_in_value !== false && <Input label="Valor Troca" name="trade_in_value" type="number" defaultValue={selectedProduct?.trade_in_value || 0} />}
                      {userPreferences.PRODUCTS_FORM?.logistics_cost !== false && <Input label="Custo Logística" name="logistics_cost" type="number" defaultValue={selectedProduct?.logistics_cost || 0} />}
                      {userPreferences.PRODUCTS_FORM?.rectification_cost !== false && <Input label="Custo Retífica (3º)" name="rectification_cost" type="number" defaultValue={selectedProduct?.rectification_cost || 0} />}
                    </div>
                    <div className="space-y-4">
                      {userPreferences.PRODUCTS_FORM?.sale_price !== false && <h4 className="text-xs font-black uppercase text-zinc-400">Dados de Preço</h4>}
                      {userPreferences.PRODUCTS_FORM?.sale_price !== false && <Input label="Preço de Venda" name="sale_price" type="number" defaultValue={selectedProduct?.sale_price || 0} />}
                      {userPreferences.PRODUCTS_FORM?.min_price !== false && <Input label="Preço Mínimo" name="min_price" type="number" defaultValue={selectedProduct?.min_price || 0} />}
                      {userPreferences.PRODUCTS_FORM?.markup !== false && <Input label="Markup (%)" name="markup" type="number" defaultValue={selectedProduct?.markup || 0} />}
                      {userPreferences.PRODUCTS_FORM?.warranty_days !== false && <Input label="Garantia (Dias)" name="warranty_days" type="number" defaultValue={selectedProduct?.warranty_days || 90} />}
                    </div>
                  </div>

                  {userPreferences.PRODUCTS_FORM?.status !== false && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Status*</label>
                      <select name="status" defaultValue={selectedProduct?.status || 'AVAILABLE'} required className="px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-yellow-400 outline-none bg-white">
                        <option value="AVAILABLE">Disponível</option>
                        <option value="RESERVED">Reservada</option>
                        <option value="IN_RECTIFICATION">Em Retífica</option>
                        <option value="CONSIGNED">Consignada</option>
                        <option value="TRADE_IN_PROCESS">Em Avaliação (Troca)</option>
                      </select>
                    </div>
                  )}
                  {userPreferences.PRODUCTS_FORM?.quantity !== false && <Input label="Quantidade Atual" name="quantity" type="number" defaultValue={selectedProduct?.quantity || 0} />}
                  {userPreferences.PRODUCTS_FORM?.min_quantity !== false && <Input label="Estoque Mínimo" name="min_quantity" type="number" defaultValue={selectedProduct?.min_quantity || 2} />}
                  {userPreferences.PRODUCTS_FORM?.location !== false && <Input label="Localização (Prateleira/Caixa)" name="location" defaultValue={selectedProduct?.location} />}
                  {userPreferences.PRODUCTS_FORM?.measurements !== false && <Input label="Medidas (se houver)" name="measurements" defaultValue={selectedProduct?.measurements} />}
                </div>
                {userPreferences.PRODUCTS_FORM?.notes !== false && <Input label="Observações Técnicas" name="notes" type="textarea" defaultValue={selectedProduct?.notes} />}
                {userPreferences.PRODUCTS_FORM?.photo_url !== false && <Input label="URL da Foto" name="photo_url" defaultValue={selectedProduct?.photo_url} placeholder="https://..." />}

                <div className="pt-4 border-t border-zinc-100 flex gap-3">
                  <Button type="submit" variant="yellow" className="flex-1 py-3">
                    <Save size={20} />
                    <span>{selectedProduct ? 'Salvar Alterações' : 'Cadastrar Peça'}</span>
                  </Button>
                  <Button variant="secondary" onClick={() => setProductModalOpen(false, null)}>Cancelar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sale Modal */}
      <AnimatePresence>
        {isSaleModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSaleModalOpen(false)} className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 bg-red-600 text-white flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">Nova Venda / Orçamento</h3>
                <button onClick={() => setSaleModalOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={24} /></button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nome do Cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Opcional" />
                    <Input label="CPF / CNPJ" value={customerDocument} onChange={(e) => setCustomerDocument(e.target.value)} placeholder="Para NF-e" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Origem da Venda</label>
                    <select value={saleOrigin} onChange={(e) => setSaleOrigin(e.target.value as SaleOrigin)} className="px-3 py-2 rounded-lg border border-zinc-200 outline-none bg-white">
                      <option value="DIRECT">Balcão (Direto)</option>
                      <option value="GOOGLE_ADS">Google Ads</option>
                      <option value="META_ADS">Meta Ads (Facebook/Insta)</option>
                      <option value="WHATSAPP">WhatsApp</option>
                    </select>
                  </div>

                  <div className="border-t border-zinc-100 pt-4">
                    <h4 className="text-xs font-black uppercase text-zinc-400 mb-3">Peça de Troca (Entrada)</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Descrição da peça..."
                        className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        id="ti-desc"
                      />
                      <input
                        type="number"
                        placeholder="Valor R$"
                        className="w-24 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
                        id="ti-val"
                      />
                      <Button variant="secondary" className="py-1 px-3" onClick={() => {
                        const desc = (document.getElementById('ti-desc') as HTMLInputElement).value;
                        const val = Number((document.getElementById('ti-val') as HTMLInputElement).value);
                        if (desc && val) {
                          setTradeInItems([...tradeInItems, { description: desc, estimated_value: val, condition: 'Usada' }]);
                          (document.getElementById('ti-desc') as HTMLInputElement).value = '';
                          (document.getElementById('ti-val') as HTMLInputElement).value = '';
                        }
                      }}>+</Button>
                    </div>
                    <div className="space-y-2">
                      {tradeInItems.map((ti, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                          <span className="text-[10px] font-bold uppercase">{ti.description}</span>
                          <span className="text-[10px] font-black">R$ {ti.estimated_value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 pt-4">
                    <h4 className="text-xs font-black uppercase text-zinc-400 mb-3">Adicionar Item</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {products.filter(p => p.quantity > 0).map(p => (
                        <div key={p.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between group">
                          <div>
                            <p className="text-xs font-bold">{p.type} {p.engine}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">R$ {p.sale_price.toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => setSaleItems([...saleItems, { product_id: p.id, type: 'PRODUCT', quantity: 1, unit_price: p.sale_price, unit_cost: p.acquisition_cost + p.rectification_cost, name: `${p.type} ${p.engine}` }])}
                            className="p-2 bg-white text-emerald-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <PlusCircle size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-zinc-50 rounded-2xl p-6 flex flex-col">
                  <h4 className="text-xs font-black uppercase text-zinc-400 mb-4">Resumo do Pedido</h4>
                  <div className="flex-1 space-y-3 overflow-y-auto mb-4">
                    {saleItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{item.name}</p>
                          <p className="text-[10px] text-zinc-400">1x R$ {item.unit_price.toLocaleString()}</p>
                        </div>
                        <button onClick={() => setSaleItems(saleItems.filter((_, idx) => idx !== i))} className="text-red-500 p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>

                  {saleItems.length > 0 && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4 space-y-2">
                      <label className="flex justify-between text-xs font-bold text-zinc-600 uppercase mb-1">
                        Aplicar Desconto (%)
                        <span className="text-red-500">{discountPercent}%</span>
                      </label>
                      <input
                        type="range" min="0" max="50" value={discountPercent}
                        onChange={(e) => setDiscountPercent(Number(e.target.value))}
                        className="w-full accent-red-600"
                      />
                      {(() => {
                        const subtotal = saleItems.reduce((acc, curr) => acc + curr.unit_price, 0);
                        const custoTotal = saleItems.reduce((acc, curr) => acc + curr.unit_cost, 0);
                        const desconto = subtotal * (discountPercent / 100);
                        const creditoTroca = tradeInItems.reduce((acc, curr) => acc + curr.estimated_value, 0);
                        const finalPrice = subtotal - desconto - creditoTroca;
                        const margemLiquida = finalPrice - custoTotal;
                        const margemPercentual = finalPrice > 0 ? (margemLiquida / finalPrice) * 100 : 0;

                        return (
                          <div className={`mt-2 p-2 rounded-lg flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${margemPercentual < 15 ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                            <span>Impacto na Margem</span>
                            <span>{margemPercentual.toFixed(1)}% ({margemPercentual < 15 ? 'CRÍTICO' : 'SAUDÁVEL'})</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="border-t border-zinc-200 pt-4 space-y-2">
                    {(() => {
                      const subtotal = saleItems.reduce((acc, curr) => acc + curr.unit_price, 0);
                      const desconto = subtotal * (discountPercent / 100);
                      const creditoTroca = tradeInItems.reduce((acc, curr) => acc + curr.estimated_value, 0);
                      const totalFinal = subtotal - desconto - creditoTroca;

                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-zinc-500 uppercase font-bold">Subtotal</span>
                            <span className="font-bold">R$ {subtotal.toLocaleString()}</span>
                          </div>
                          {discountPercent > 0 && (
                            <div className="flex justify-between text-sm text-yellow-600">
                              <span className="uppercase font-bold">Desconto ({discountPercent}%)</span>
                              <span className="font-bold">- R$ {desconto.toLocaleString()}</span>
                            </div>
                          )}
                          {creditoTroca > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                              <span className="uppercase font-bold">Crédito Troca</span>
                              <span className="font-bold">- R$ {creditoTroca.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm pt-2 border-t border-zinc-100">
                            <span className="text-zinc-900 uppercase font-black">Total a Pagar</span>
                            <span className="font-black text-xl text-red-600">R$ {Math.max(0, totalFinal).toLocaleString()}</span>
                          </div>
                        </>
                      )
                    })()}

                    <Button
                      variant="red"
                      className="w-full py-4 mt-4"
                      disabled={saleItems.length === 0}
                      onClick={async () => {
                        const subtotal = saleItems.reduce((acc, curr) => acc + curr.unit_price, 0);
                        const descontoValue = subtotal * (discountPercent / 100);

                        // Sale Persistence Logic
                        try {
                          await apiService.createSale({
                            user_id: currentUser.id,
                            customer_name: customerName,
                            customer_document: customerDocument,
                            items: saleItems,
                            origin: saleOrigin,
                            trade_ins: tradeInItems,
                            discount_value: descontoValue
                          });
                          setSaleModalOpen(false);
                          fetchData();
                        } catch (error) {
                          console.error("Erro ao salvar venda", error);
                        }
                      }}
                    >
                      Finalizar Venda
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Stock Agent Bot */}
      <StockAgent />
    </div>
  );
}
