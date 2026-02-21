import express from "express";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- Supabase Client ---
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ziwgdblrdpwhponnlyrk.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppd2dkYmxyZHB3aHBvbm5seXJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzNDg2NSwiZXhwIjoyMDg3MjEwODY1fQ.qExMCvTtLlNekMFkMvCGC1PO9St37WeBkVHECYu76p8";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Seed Initial Users ---
async function seedUsers() {
  const { data: users } = await supabase.from("users").select("id").limit(1);
  if (!users || users.length === 0) {
    const adminHash = bcrypt.hashSync("admin123", 10);
    const employeeHash = bcrypt.hashSync("123456", 10);
    await supabase.from("users").insert([
      { name: "Carlão", role: "OWNER", password: adminHash },
      { name: "Funcionario", role: "EMPLOYEE", password: employeeHash },
    ]);
    console.log("Initial users seeded.");
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "carlao_erp_super_secret_key_2026";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// --- Auth Routes ---
app.post("/api/auth/login", async (req, res) => {
  const { name, password } = req.body;
  try {
    const { data: users, error } = await supabase.from("users").select("*").eq("name", name).limit(1);
    if (error || !users || users.length === 0) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }
    const user = users[0];
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Senha incorreta" });
    }
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "12h" });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// --- Products API ---
app.get("/api/products", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*").order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get("/api/products/:id", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*").eq("id", req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Fix empty strings for UNIQUE nullable columns
function sanitizeProduct(body: any) {
  const out = { ...body };
  for (const key of ['internal_code', 'manufacturer_code']) {
    if (out[key] === '' || out[key] === undefined) out[key] = null;
  }
  return out;
}

app.post("/api/products", async (req, res) => {
  const body = sanitizeProduct(req.body);
  const total_cost = (body.acquisition_cost || 0) + (body.trade_in_value || 0) + (body.logistics_cost || 0) + (body.rectification_cost || 0);
  const { data, error } = await supabase.from("products").insert({ ...body, total_cost }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.put("/api/products/:id", async (req, res) => {
  const body = sanitizeProduct(req.body);
  const total_cost = (body.acquisition_cost || 0) + (body.trade_in_value || 0) + (body.logistics_cost || 0) + (body.rectification_cost || 0);
  const { error } = await supabase.from("products").update({ ...body, total_cost, updated_at: new Date().toISOString() }).eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// --- Movements ---
app.post("/api/movements", async (req, res) => {
  const { product_id, type, quantity, user_id, reason } = req.body;
  const { error: mvError } = await supabase.from("movements").insert({ product_id, type, quantity, user_id, reason });
  if (mvError) return res.status(400).json({ error: mvError.message });

  let updateData: any = {};
  if (type === "ADJUST") {
    updateData = { quantity };
  } else {
    const { data: prod } = await supabase.from("products").select("quantity").eq("id", product_id).single();
    const change = type === "IN" ? quantity : -quantity;
    updateData = { quantity: (prod?.quantity || 0) + change };
  }
  await supabase.from("products").update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", product_id);
  res.json({ success: true });
});

// --- Sales ---
app.get("/api/sales", async (req, res) => {
  const { data, error } = await supabase.from("sales").select("*, sale_items(*)").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/sales", async (req, res) => {
  const { user_id, customer_name, customer_document, items, origin, trade_ins, discount_value } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: "No items" });

  let totalValue = 0;
  let totalCost = 0;
  let tradeInTotal = 0;

  if (trade_ins?.length > 0) trade_ins.forEach((ti: any) => { tradeInTotal += ti.estimated_value; });
  items.forEach((item: any) => { totalValue += item.unit_price * item.quantity; totalCost += item.unit_cost * item.quantity; });

  const finalValue = totalValue - (discount_value || 0) - tradeInTotal;
  const margin = finalValue - totalCost;

  const { data: sale, error: saleError } = await supabase.from("sales").insert({
    user_id, customer_name, customer_document, total_value: finalValue, total_cost: totalCost, margin, origin: origin || "DIRECT",
    warranty_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  }).select().single();

  if (saleError) return res.status(400).json({ error: saleError.message });
  const saleId = sale.id;

  // Insert items and update stock
  for (const item of items) {
    await supabase.from("sale_items").insert({ sale_id: saleId, product_id: item.product_id, service_name: item.service_name, quantity: item.quantity, unit_price: item.unit_price, unit_cost: item.unit_cost, type: item.type });
    if (item.type === "PRODUCT" && item.product_id) {
      const { data: prod } = await supabase.from("products").select("quantity").eq("id", item.product_id).single();
      await supabase.from("products").update({ quantity: (prod?.quantity || 0) - item.quantity, updated_at: new Date().toISOString() }).eq("id", item.product_id);
    }
  }

  if (trade_ins?.length > 0) {
    for (const ti of trade_ins) {
      await supabase.from("trade_ins").insert({ sale_id: saleId, description: ti.description, estimated_value: ti.estimated_value, condition: ti.condition });
    }
  }

  await supabase.from("financial_transactions").insert({ type: "INCOME", category: "SALE", amount: finalValue, description: `Venda #${saleId} - ${customer_name || "Consumidor"}`, sale_id: saleId });

  res.json({ id: saleId });
});

// --- Finance ---
app.get("/api/finance/transactions", async (req, res) => {
  const { data, error } = await supabase.from("financial_transactions").select("*").order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Marketing Stats ---
app.get("/api/marketing/stats", async (req, res) => {
  const { data, error } = await supabase.from("sales").select("origin, total_value, margin");
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
});

// --- Dashboard ---
app.get("/api/dashboard", async (req, res) => {
  const [
    { data: products },
    { data: lowStock },
    { data: recentSales },
    { data: income },
    { data: expense },
    { data: salesAgg }
  ] = await Promise.all([
    supabase.from("products").select("quantity, total_cost"),
    supabase.from("products").select("*").lte("quantity", 2).limit(5),
    supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("financial_transactions").select("amount").eq("type", "INCOME"),
    supabase.from("financial_transactions").select("amount").eq("type", "EXPENSE"),
    supabase.from("sales").select("total_value, margin")
  ]);

  const totalItems = (products || []).reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
  const inventoryValue = (products || []).reduce((sum: number, p: any) => sum + ((p.quantity || 0) * (p.total_cost || 0)), 0);
  const totalIncome = (income || []).reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpense = (expense || []).reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalRevenue = (salesAgg || []).reduce((sum: number, s: any) => sum + s.total_value, 0);
  const totalMargin = (salesAgg || []).reduce((sum: number, s: any) => sum + s.margin, 0);

  res.json({
    total_items: { count: totalItems },
    inventory_value: { value: inventoryValue },
    low_stock: lowStock || [],
    recent_sales: recentSales || [],
    financial_summary: { income: totalIncome, expense: totalExpense },
    top_products: [],
    total_revenue: totalRevenue,
    sales_count: (salesAgg || []).length,
    total_margin: totalMargin,
  });
});

// --- Stock Report ---
app.get("/api/reports/stock", async (req, res) => {
  const { data, error } = await supabase.from("products").select("*").order("quantity", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// --- Customers ---
app.get("/api/customers", async (req, res) => {
  const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/api/customers", async (req, res) => {
  const { name, document, phone, email, city, type, preferences, notes } = req.body;
  const { data, error } = await supabase.from("customers").insert({ name, document, phone, email, city, type, preferences: JSON.stringify(preferences || {}), notes }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ id: data.id });
});

app.put("/api/customers/:id", async (req, res) => {
  const { name, document, phone, email, city, type, preferences, notes } = req.body;
  const { error } = await supabase.from("customers").update({ name, document, phone, email, city, type, preferences: JSON.stringify(preferences || {}), notes, updated_at: new Date().toISOString() }).eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// --- User Preferences ---
app.get("/api/user_preferences/:userId/:module", async (req, res) => {
  const { userId, module } = req.params;
  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", userId).eq("module", module).single();
  res.json(data || { config: "{}" });
});

app.post("/api/user_preferences", async (req, res) => {
  const { user_id, module, config } = req.body;
  const { error } = await supabase.from("user_preferences").upsert({ user_id, module, config: JSON.stringify(config), updated_at: new Date().toISOString() }, { onConflict: "user_id,module" });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true });
});

// --- Error Handler ---
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// --- Export for Vercel ---
export default app;

// --- Local Dev ---
if (process.env.NODE_ENV !== "production") {
  (async () => {
    await seedUsers();
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => console.log(`Local Dev Server running on http://localhost:${PORT}`));
  })();
} else {
  // Seed users on first cold start in production too
  seedUsers();
}
