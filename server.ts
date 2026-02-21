import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("estoque_v3.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year_range TEXT,
    engine TEXT NOT NULL,
    internal_code TEXT UNIQUE,
    manufacturer_code TEXT,
    measurements TEXT,
    condition TEXT NOT NULL, -- 'Nova', 'Usada', 'Retificada'
    status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RESERVED', 'IN_RECTIFICATION', 'CONSIGNED', 'TRADE_IN_PROCESS'
    
    -- Cost Data
    acquisition_cost REAL DEFAULT 0,
    trade_in_value REAL DEFAULT 0,
    logistics_cost REAL DEFAULT 0,
    rectification_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0, -- Calculated: acq + trade + log + rect
    
    -- Price Data
    sale_price REAL DEFAULT 0,
    min_price REAL DEFAULT 0,
    markup REAL DEFAULT 0,
    suggested_price REAL DEFAULT 0,
    
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 2,
    location TEXT,
    supplier_id INTEGER,
    notes TEXT,
    photo_url TEXT,
    warranty_days INTEGER DEFAULT 90,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    customer_name TEXT,
    customer_document TEXT, -- CPF/CNPJ for NF-e
    total_value REAL NOT NULL,
    total_cost REAL NOT NULL,
    margin REAL NOT NULL,
    origin TEXT DEFAULT 'DIRECT',
    fiscal_status TEXT DEFAULT 'PENDING', -- 'PENDING', 'ISSUED', 'ERROR'
    nfe_key TEXT,
    warranty_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    technical_report TEXT,
    refund_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'RESOLVED', 'REJECTED'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trade_ins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER, -- Optional, if part of a sale
    description TEXT NOT NULL,
    estimated_value REAL NOT NULL,
    condition TEXT NOT NULL,
    status TEXT DEFAULT 'RECEIVED', -- 'RECEIVED', 'SENT_TO_RECTIFICATION', 'READY_FOR_STOCK'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER,
    service_name TEXT,
    quantity INTEGER,
    unit_price REAL NOT NULL,
    unit_cost REAL NOT NULL,
    type TEXT NOT NULL, -- 'PRODUCT', 'SERVICE'
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS financial_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- 'INCOME', 'EXPENSE'
    category TEXT NOT NULL, -- 'SALE', 'PURCHASE', 'RENT', 'SALARY', 'MARKETING', 'OTHER'
    amount REAL NOT NULL,
    description TEXT,
    sale_id INTEGER,
    due_date DATETIME,
    status TEXT DEFAULT 'PAID', -- 'PAID', 'PENDING'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );

  CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL, -- 'GOOGLE', 'META'
    name TEXT NOT NULL,
    cost REAL NOT NULL,
    clicks INTEGER,
    conversions INTEGER,
    start_date DATETIME,
    end_date DATETIME
  );

  CREATE TABLE IF NOT EXISTS movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'IN', 'OUT', 'ADJUST'
    quantity INTEGER NOT NULL,
    user_id INTEGER,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    type TEXT DEFAULT 'PF', -- 'PF', 'OFICINA', 'REVENDA', 'FROTA'
    preferences TEXT, -- JSON fields e.g. preferred engines
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    module TEXT NOT NULL, -- 'UI_LAYOUT'
    config TEXT NOT NULL, -- JSON string of active fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Seed initial user if not exists
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const adminHash = bcrypt.hashSync("admin123", 10);
  const employeeHash = bcrypt.hashSync("123456", 10);
  db.prepare("INSERT INTO users (name, role, password) VALUES (?, ?, ?)").run("Carlão", "OWNER", adminHash);
  db.prepare("INSERT INTO users (name, role, password) VALUES (?, ?, ?)").run("Funcionario", "EMPLOYEE", employeeHash);
}

const JWT_SECRET = process.env.JWT_SECRET || 'carlao_erp_super_secret_key_2026';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Auth Routes
app.post("/api/auth/login", (req, res) => {
  const { name, password } = req.body;
  try {
    const user = db.prepare("SELECT * FROM users WHERE name = ?").get(name) as any;
    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado" });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Auth Middleware
const verifyToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Nenhum token fornecido' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token malformado' });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(401).json({ error: 'Token inválido ou expirado' });
    req.user = decoded;
    next();
  });
};

// Protect all /api routes except auth
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) {
    return next();
  }
  verifyToken(req, res, next);
});

// API Routes
app.get("/api/products", (req, res) => {
  const products = db.prepare("SELECT * FROM products ORDER BY updated_at DESC").all();
  res.json(products);
});

app.get("/api/products/:id", (req, res) => {
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id);
  res.json(product);
});

app.post("/api/products", (req, res) => {
  const {
    type, brand, model, year_range, engine, internal_code,
    manufacturer_code, measurements, condition, quantity,
    min_quantity, location, notes, photo_url,
    acquisition_cost, trade_in_value, logistics_cost, rectification_cost,
    sale_price, min_price, markup, suggested_price, warranty_days
  } = req.body;

  const total_cost = (acquisition_cost || 0) + (trade_in_value || 0) + (logistics_cost || 0) + (rectification_cost || 0);

  try {
    const info = db.prepare(`
        INSERT INTO products (
          type, brand, model, year_range, engine, internal_code,
          manufacturer_code, measurements, condition, quantity,
          min_quantity, location, notes, photo_url,
          acquisition_cost, trade_in_value, logistics_cost, rectification_cost, total_cost,
          sale_price, min_price, markup, suggested_price, warranty_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
      type, brand, model, year_range, engine, internal_code,
      manufacturer_code, measurements, condition, quantity || 0,
      min_quantity || 2, location, notes, photo_url,
      acquisition_cost || 0, trade_in_value || 0, logistics_cost || 0, rectification_cost || 0, total_cost,
      sale_price || 0, min_price || 0, markup || 0, suggested_price || 0, warranty_days || 90
    );
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/products/:id", (req, res) => {
  const {
    type, brand, model, year_range, engine, internal_code,
    manufacturer_code, measurements, condition, quantity,
    min_quantity, location, notes, photo_url,
    acquisition_cost, trade_in_value, logistics_cost, rectification_cost,
    sale_price, min_price, markup, suggested_price, warranty_days
  } = req.body;

  const total_cost = (acquisition_cost || 0) + (trade_in_value || 0) + (logistics_cost || 0) + (rectification_cost || 0);

  db.prepare(`
      UPDATE products SET
        type = ?, brand = ?, model = ?, year_range = ?, engine = ?,
        internal_code = ?, manufacturer_code = ?, measurements = ?,
        condition = ?, quantity = ?, min_quantity = ?, location = ?,
        notes = ?, photo_url = ?, 
        acquisition_cost = ?, trade_in_value = ?, logistics_cost = ?, rectification_cost = ?, total_cost = ?,
        sale_price = ?, min_price = ?, markup = ?, suggested_price = ?, warranty_days = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
    type, brand, model, year_range, engine, internal_code,
    manufacturer_code, measurements, condition, quantity,
    min_quantity, location, notes, photo_url,
    acquisition_cost || 0, trade_in_value || 0, logistics_cost || 0, rectification_cost || 0, total_cost,
    sale_price || 0, min_price || 0, markup || 0, suggested_price || 0, warranty_days || 90,
    req.params.id
  );
  res.json({ success: true });
});

app.post("/api/movements", (req, res) => {
  const { product_id, type, quantity, user_id, reason } = req.body;

  const dbTransaction = db.transaction(() => {
    // Record movement
    db.prepare(`
        INSERT INTO movements (product_id, type, quantity, user_id, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(product_id, type, quantity, user_id, reason);

    // Update product quantity
    const change = type === 'IN' ? quantity : (type === 'OUT' ? -quantity : 0);
    if (type === 'ADJUST') {
      db.prepare("UPDATE products SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(quantity, product_id);
    } else {
      db.prepare("UPDATE products SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(change, product_id);
    }
  });

  try {
    dbTransaction();
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/dashboard", (req, res) => {
  const stats = {
    total_items: db.prepare("SELECT COUNT(*) as count FROM products").get() as any,
    inventory_value: db.prepare("SELECT SUM(acquisition_cost * quantity) as value FROM products").get() as any,
    low_stock: db.prepare("SELECT * FROM products WHERE quantity <= min_quantity").all(),
    recent_sales: db.prepare("SELECT * FROM sales ORDER BY created_at DESC LIMIT 5").all(),
    financial_summary: db.prepare(`
        SELECT 
          SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expense
        FROM financial_transactions
        WHERE created_at >= date('now', 'start of month')
      `).get() as any,
    top_products: db.prepare(`
        SELECT p.type, p.engine, COUNT(si.id) as sales_count
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.type = 'PRODUCT'
        GROUP BY p.id ORDER BY sales_count DESC LIMIT 5
      `).all()
  };
  res.json(stats);
});

app.post("/api/sales", (req, res) => {
  const { user_id, customer_name, customer_document, items, origin, trade_ins, discount_value } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: "No items" });
  const dbTransaction = db.transaction(() => {
    let totalValue = 0;
    let totalCost = 0;
    let tradeInTotal = 0;

    if (trade_ins && trade_ins.length > 0) {
      trade_ins.forEach((ti: any) => {
        tradeInTotal += ti.estimated_value;
      });
    }

    items.forEach((item: any) => {
      totalValue += item.unit_price * item.quantity;
      totalCost += item.unit_cost * item.quantity;
    });

    const finalValue = totalValue - (discount_value || 0) - tradeInTotal;
    const margin = finalValue - totalCost;

    const saleInfo = db.prepare(`
        INSERT INTO sales (user_id, customer_name, customer_document, total_value, total_cost, margin, origin, warranty_until)
        VALUES (?, ?, ?, ?, ?, ?, ?, date('now', '+90 days'))
      `).run(user_id, customer_name, customer_document, finalValue, totalCost, margin, origin || 'DIRECT');

    const saleId = saleInfo.lastInsertRowid;

    items.forEach((item: any) => {
      db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, service_name, quantity, unit_price, unit_cost, type)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(saleId, item.product_id, item.service_name, item.quantity, item.unit_price, item.unit_cost, item.type);

      if (item.type === 'PRODUCT' && item.product_id) {
        db.prepare("UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .run(item.quantity, item.product_id);
      }
    });

    if (trade_ins && trade_ins.length > 0) {
      trade_ins.forEach((ti: any) => {
        db.prepare(`
            INSERT INTO trade_ins (sale_id, description, estimated_value, condition)
            VALUES (?, ?, ?, ?)
          `).run(saleId, ti.description, ti.estimated_value, ti.condition);
      });
    }

    db.prepare(`
        INSERT INTO financial_transactions (type, category, amount, description, sale_id)
        VALUES ('INCOME', 'SALE', ?, ?, ?)
      `).run(finalValue, `Venda #${saleId} - ${customer_name || 'Consumidor'}`, saleId);

    return saleId;
  });

  try {
    const id = dbTransaction();
    res.json({ id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/finance/transactions", (req, res) => {
  const transactions = db.prepare("SELECT * FROM financial_transactions ORDER BY created_at DESC").all();
  res.json(transactions);
});

app.get("/api/marketing/stats", (req, res) => {
  const stats = db.prepare(`
      SELECT origin, COUNT(*) as count, SUM(total_value) as revenue, SUM(margin) as profit
      FROM sales GROUP BY origin
    `).all();
  res.json(stats);
});

app.get("/api/dashboard", (req, res) => {
  const totalItems = db.prepare("SELECT SUM(quantity) as count FROM products").get() as any;
  const inventoryValue = db.prepare("SELECT SUM(quantity * total_cost) as value FROM products").get() as any;
  const lowStock = db.prepare("SELECT * FROM products WHERE quantity <= min_quantity LIMIT 5").all();
  const recentSales = db.prepare("SELECT * FROM sales ORDER BY created_at DESC LIMIT 5").all();

  // Financial Summary
  const income = db.prepare("SELECT SUM(amount) as total FROM financial_transactions WHERE type = 'INCOME'").get() as any;
  const expense = db.prepare("SELECT SUM(amount) as total FROM financial_transactions WHERE type = 'EXPENSE'").get() as any;

  // Revenue, Sales Count, Margin for Bot
  const salesAgg = db.prepare("SELECT COUNT(*) as count, SUM(total_value) as revenue, SUM(margin) as margin FROM sales").get() as any;

  res.json({
    total_items: { count: totalItems?.count || 0 },
    inventory_value: { value: inventoryValue?.value || 0 },
    low_stock: lowStock,
    recent_sales: recentSales,
    financial_summary: { income: income?.total || 0, expense: expense?.total || 0 },
    top_products: [],

    // Bot specific extensions
    total_revenue: salesAgg?.revenue || 0,
    sales_count: salesAgg?.count || 0,
    total_margin: salesAgg?.margin || 0
  });
});

app.get("/api/reports/stock", (req, res) => {
  const report = db.prepare("SELECT * FROM products ORDER BY quantity ASC").all();
  res.json(report);
});

// --- CUSTOMERS API ---
app.get("/api/customers", (req, res) => {
  const customers = db.prepare("SELECT * FROM customers ORDER BY name ASC").all();
  res.json(customers);
});

app.post("/api/customers", (req, res) => {
  const { name, document, phone, email, city, type, preferences, notes } = req.body;
  try {
    const info = db.prepare(`
        INSERT INTO customers (name, document, phone, email, city, type, preferences, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, document, phone, email, city, type, JSON.stringify(preferences || {}), notes);
    res.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/customers/:id", (req, res) => {
  const { name, document, phone, email, city, type, preferences, notes } = req.body;
  try {
    db.prepare(`
        UPDATE customers SET name = ?, document = ?, phone = ?, email = ?, city = ?, type = ?, preferences = ?, notes = ?
        WHERE id = ?
      `).run(name, document, phone, email, city, type, JSON.stringify(preferences || {}), notes, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- USER CONFIG / PREFS API ---
app.get("/api/user_preferences/:userId/:module", (req, res) => {
  const { userId, module } = req.params;
  const pref = db.prepare("SELECT * FROM user_preferences WHERE user_id = ? AND module = ?").get(userId, module);
  res.json(pref || { config: "{}" });
});

app.post("/api/user_preferences", (req, res) => {
  const { user_id, module, config } = req.body;
  try {
    db.prepare(`
        INSERT INTO user_preferences (user_id, module, config)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, module) DO UPDATE SET config = excluded.config, updated_at = CURRENT_TIMESTAMP
      `).run(user_id, module, JSON.stringify(config));
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Export for Vercel
export default app;

// Local Development Server
if (process.env.NODE_ENV !== "production") {
  (async () => {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Local Dev Server running on http://localhost:${PORT}`);
    });
  })();
} else {
  // Production Static File Serving (If running as a standalone process rather than Vercel Serverless)
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  // Conditionally listen if not imported as a module (e.g. node server.js)
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Production Server running on port ${PORT}`);
    });
  }
}
