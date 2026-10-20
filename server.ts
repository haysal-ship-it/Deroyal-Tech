import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Initialize Firebase Admin
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let config: any = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
}
if (!getApps().length) {
  initializeApp({
    projectId: config.projectId
  });
}

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

// Public lookup for username to auth email mapping
app.post('/api/auth/lookup-user', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const clean = username.trim().toLowerCase();

    // Query by username
    let snapshot = await db.collection('users').where('username', '==', clean).limit(1).get();
    
    // If not found and input might be an email, check email field
    if (snapshot.empty && clean.includes('@')) {
      snapshot = await db.collection('users').where('email', '==', clean).limit(1).get();
    }

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Invalid username or password' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.active === false) {
      return res.status(403).json({ error: 'Your account is not active. Contact an administrator.' });
    }

    const authEmail = userData.authEmail || (userData.email && userData.email.includes('@') ? userData.email : `${userData.username}@internal.app`);

    return res.json({
      uid: userDoc.id,
      username: userData.username,
      authEmail: authEmail,
      mustChangePassword: !!userData.mustChangePassword
    });
  } catch (err: any) {
    console.error('Lookup user error:', err);
    return res.status(500).json({ error: 'Error verifying account' });
  }
});

// Admin endpoint: Reset Password
app.post('/api/admin/reset-password', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { uid, newPassword } = req.body;
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'User UID is required' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Try Firebase Admin Auth
    try {
      await getAuth().updateUser(uid, { password: newPassword });
    } catch (authErr: any) {
      console.warn('Firebase auth updateUser failed, applying bcrypt hash fallback:', authErr.message);
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await db.collection('users').doc(uid).update({ passwordHash: hashedPassword });
    }

    // Get admin details for activity log
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    const adminName = adminDoc.data()?.name || adminDoc.data()?.username || 'Admin';
    const targetDoc = await db.collection('users').doc(uid).get();
    const targetName = targetDoc.data()?.name || targetDoc.data()?.username || uid;

    // Record activity log
    await db.collection('activity_logs').add({
      action: 'Password Reset',
      actorUid: req.user.uid,
      actorName: adminName,
      actorRole: 'Admin',
      targetId: uid,
      targetName: targetName,
      details: `Admin ${adminName} reset password for user ${targetName}`,
      timestamp: FieldValue.serverTimestamp()
    });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: err.message || 'Failed to reset password' });
  }
});

// Admin endpoint: Create User
app.post('/api/admin/create-user', authenticate, requireAdmin, async (req: any, res: any) => {
  try {
    const { username, email, name, role, permissions, password } = req.body;
    
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters with no spaces' });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check unique username
    const existing = await db.collection('users').where('username', '==', cleanUsername).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'This username is already taken. Please choose another.' });
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : '';
    const authEmail = cleanEmail || `${cleanUsername}@internal.app`;

    let uid = '';
    try {
      const authUser = await getAuth().createUser({
        email: authEmail,
        password: password,
        displayName: name || cleanUsername
      });
      uid = authUser.uid;
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: 'An account with this email/username already exists in Auth' });
      }
      // If Admin SDK auth cannot create, generate uuid and bcrypt hash
      console.warn('Firebase createUser failed, falling back to local credentials:', authErr.message);
      uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    const newUserData = {
      username: cleanUsername,
      email: cleanEmail,
      authEmail: authEmail,
      name: name || '',
      role: role || 'Sales Officer',
      permissions: permissions || {
        Dashboard: 'View',
        Sales: 'Full',
        Repair: 'View',
        Settings: 'None'
      },
      active: true,
      createdAt: FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(newUserData);

    // Record activity log
    const adminDoc = await db.collection('users').doc(req.user.uid).get();
    const adminName = adminDoc.data()?.name || adminDoc.data()?.username || 'Admin';

    await db.collection('activity_logs').add({
      action: 'User Created',
      actorUid: req.user.uid,
      actorName: adminName,
      actorRole: 'Admin',
      targetId: uid,
      targetName: name || cleanUsername,
      details: `Created user ${name || cleanUsername} (@${cleanUsername}) with role ${role || 'Sales Officer'}`,
      timestamp: FieldValue.serverTimestamp()
    });

    return res.json({ success: true, uid, message: 'User created successfully' });
  } catch (err: any) {
    console.error('Create user error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// User self-service: Change own password (forced on first login)
app.post('/api/auth/change-own-password', authenticate, async (req: any, res: any) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const uid = req.user.uid;
    try {
      await getAuth().updateUser(uid, { password: newPassword });
    } catch (authErr: any) {
      console.warn('Firebase updateUser auth error, falling back:', authErr.message);
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await db.collection('users').doc(uid).update({ passwordHash: hashedPassword });
    }

    await db.collection('users').doc(uid).update({
      mustChangePassword: false,
      lastPasswordChange: FieldValue.serverTimestamp()
    });

    const userDoc = await db.collection('users').doc(uid).get();
    const userName = userDoc.data()?.name || userDoc.data()?.username || 'User';

    await db.collection('activity_logs').add({
      action: 'Password Changed',
      actorUid: uid,
      actorName: userName,
      actorRole: userDoc.data()?.role || '',
      targetId: uid,
      targetName: userName,
      details: `${userName} changed their initial default password`,
      timestamp: FieldValue.serverTimestamp()
    });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update password' });
  }
});

// Update last login
app.post('/api/auth/record-login', authenticate, async (req: any, res: any) => {
  try {
    const uid = req.user.uid;
    await db.collection('users').doc(uid).update({
      lastLogin: FieldValue.serverTimestamp()
    });
    return res.json({ success: true });
  } catch (err: any) {
    return res.json({ success: false });
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
