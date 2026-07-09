import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let config: any = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
admin.initializeApp({
  projectId: config.projectId
});

// Load config to get database ID
let databaseId = config.firestoreDatabaseId || '(default)';

const db = getFirestore(databaseId);

const app = express();
app.use(express.json());

// Middleware to verify Firebase token
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check admin role
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// User Management (Admin only)
app.post('/api/users', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { username, password, name, role, permissions } = req.body;
    
    let email = username;
    if (!email.includes('@')) {
      email = `${username}@example.com`;
    }

    // Create auth user
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    // Create user document
    const newUser = {
      username,
      email,
      name,
      role,
      permissions,
      createdAt: FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(userRecord.uid).set(newUser);
    res.json({ success: true, uid: userRecord.uid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:uid', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { username, password, name, role, permissions } = req.body;
    const uid = req.params.uid;
    
    let email = username;
    if (username && !username.includes('@')) {
      email = `${username}@example.com`;
    }

    // Update auth user if needed
    const updateAuth: any = {};
    if (password) updateAuth.password = password;
    if (email) updateAuth.email = email;
    if (name) updateAuth.displayName = name;
    
    if (Object.keys(updateAuth).length > 0) {
      await getAuth().updateUser(uid, updateAuth);
    }

    // Update user document
    const updatedUser: any = {};
    if (username !== undefined) updatedUser.username = username;
    if (email !== undefined) updatedUser.email = email;
    if (name !== undefined) updatedUser.name = name;
    if (role !== undefined) updatedUser.role = role;
    if (permissions !== undefined) updatedUser.permissions = permissions;
    
    if (Object.keys(updatedUser).length > 0) {
      await db.collection('users').doc(uid).update(updatedUser);
    }
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:uid', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const uid = req.params.uid;
    await getAuth().deleteUser(uid);
    await db.collection('users').doc(uid).delete();
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
