export type ProductCondition = 'Nova' | 'Usada' | 'Retificada';
export type ProductStatus = 'AVAILABLE' | 'RESERVED' | 'IN_RECTIFICATION' | 'CONSIGNED' | 'TRADE_IN_PROCESS';
export type MovementType = 'IN' | 'OUT' | 'ADJUST';
export type UserRole = 'OWNER' | 'EMPLOYEE';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionCategory = 'SALE' | 'PURCHASE' | 'RENT' | 'SALARY' | 'MARKETING' | 'OTHER';
export type SaleOrigin = 'DIRECT' | 'GOOGLE_ADS' | 'META_ADS' | 'WHATSAPP';
export type FiscalStatus = 'PENDING' | 'ISSUED' | 'ERROR';

export interface Product {
  id: number;
  type: string;
  brand: string;
  model: string;
  year_range: string;
  engine: string;
  internal_code: string;
  manufacturer_code: string;
  measurements: string;
  condition: ProductCondition;
  status: ProductStatus;

  // Cost Data
  acquisition_cost: number;
  trade_in_value: number;
  logistics_cost: number;
  rectification_cost: number;
  total_cost: number;

  // Price Data
  sale_price: number;
  min_price: number;
  markup: number;
  suggested_price: number;

  quantity: number;
  min_quantity: number;
  location: string;
  supplier_id?: number;
  notes: string;
  photo_url: string;
  warranty_days: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  user_id: number;
  customer_name: string;
  customer_document?: string;
  total_value: number;
  total_cost: number;
  margin: number;
  origin: SaleOrigin;
  fiscal_status: FiscalStatus;
  nfe_key?: string;
  warranty_until?: string;
  created_at: string;
}

export interface TradeIn {
  id: number;
  sale_id?: number;
  description: string;
  estimated_value: number;
  condition: string;
  status: string;
  created_at: string;
}

export interface SaleReturn {
  id: number;
  sale_id: number;
  product_id: number;
  reason: string;
  technical_report?: string;
  refund_amount: number;
  status: 'OPEN' | 'RESOLVED' | 'REJECTED';
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id?: number;
  service_name?: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  type: 'PRODUCT' | 'SERVICE';
}

export interface Transaction {
  id: number;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string;
  sale_id?: number;
  due_date?: string;
  status: 'PAID' | 'PENDING';
  created_at: string;
}

export interface DashboardStats {
  total_items: { count: number };
  inventory_value: { value: number };
  low_stock: Product[];
  recent_sales: Sale[];
  financial_summary: { income: number; expense: number };
  top_products: { type: string; engine: string; sales_count: number }[];
  total_revenue: number;
  sales_count: number;
  total_margin: number;
}

export interface User {
  id: number;
  name: string;
  role: UserRole;
}
