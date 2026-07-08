import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// In-memory data store
let users: any[] = [];
let companySettings: any = {
  sidebarLogoUrl: '',
  sidebarName: 'RepairTech',
  loginImageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2464&auto=format&fit=crop'
};

// Middleware to check authentication
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check admin role
const requireAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth APIs
app.post('/api/auth/setup', async (req, res) => {
  try {
    if (users.length > 0) {
      return res.status(400).json({ error: 'Already setup' });
    }
    const hashedPassword = await bcrypt.hash('admin', 10);
    const adminUser = {
      id: 'admin_user',
      username: 'admin',
      password: hashedPassword,
      name: 'Default Admin',
      role: 'Admin',
      permissions: {
        Dashboard: 'Full',
        Sales: 'Full',
        Repair: 'Full',
        Settings: 'Full'
      },
      createdAt: new Date().toISOString()
    };
    users.push(adminUser);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ uid: user.id, username: user.username, role: user.role, permissions: user.permissions }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    
    const userData = { uid: user.id, username: user.username, name: user.name, role: user.role, permissions: user.permissions };
    res.json({ success: true, user: userData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

app.get('/api/auth/me', authenticate, async (req: any, res: any) => {
  try {
    const user = users.find(u => u.id === req.user.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        uid: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// User Management (Admin only)
app.get('/api/users', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const userList = users.map(user => ({
      uid: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      permissions: user.permissions
    }));
    res.json(userList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { username, password, name, role, permissions } = req.body;
    
    const existing = users.find(u => u.username === username);
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      name,
      role,
      permissions,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    res.json({ success: true, uid: newUser.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:uid', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { username, password, name, role, permissions } = req.body;
    const uid = req.params.uid;
    
    const userIndex = users.findIndex(u => u.id === uid);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = { ...users[userIndex], username, name, role, permissions };
    if (password) {
      updatedUser.password = await bcrypt.hash(password, 10);
    }
    
    users[userIndex] = updatedUser;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const uid = req.params.uid;
    users = users.filter(u => u.id !== uid);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Settings APIs (Admin only)
app.get('/api/settings', async (req, res) => {
  try {
    res.json(companySettings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    companySettings = { ...companySettings, ...req.body };
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
