import fs from 'fs';
let content = fs.readFileSync('src/components/UserManagement.tsx', 'utf8');

// Imports
content = content.replace(
  "import { collection, onSnapshot, query } from 'firebase/firestore';",
  "import { collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';\nimport { createUserWithEmailAndPassword } from 'firebase/auth';\nimport { secondaryAuth } from '../lib/firebase';"
);

// handleSave & handleDelete
const oldHandlers = `  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      
      if (editingUser.isNew) {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(editingUser)
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || 'Failed to create user');
        }
      } else {
        const res = await fetch(\`/api/users/\${editingUser.uid}\`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify(editingUser)
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.error || 'Failed to update user');
        }
      }
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(\`/api/users/\${uid}\`, {
        method: 'DELETE',
        headers: {
          'Authorization': \`Bearer \${token}\`
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };`;

const newHandlers = `  const handleSave = async () => {
    if (!editingUser) return;
    try {
      let email = editingUser.username || '';
      if (email && !email.includes('@')) {
        email = \`\${email}@example.com\`;
      }
      if (!email) {
        throw new Error("Username/Email is required.");
      }
      
      if (editingUser.isNew) {
        if (!editingUser.password) {
          throw new Error("Password is required for new users.");
        }
        
        let cred;
        try {
           cred = await createUserWithEmailAndPassword(secondaryAuth, email, editingUser.password);
        } catch (authErr: any) {
           if (authErr.code === 'auth/weak-password') {
             throw new Error("Password is too weak. Please use at least 6 characters.");
           } else if (authErr.code === 'auth/email-already-in-use') {
             throw new Error("This username/email is already in use.");
           } else {
             throw authErr;
           }
        }
        
        const newUser = {
          username: editingUser.username,
          email,
          name: editingUser.name || '',
          role: editingUser.role,
          permissions: editingUser.permissions,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', cred.user.uid), newUser);
      } else {
        const updatedUser: any = {
          username: editingUser.username,
          email,
          name: editingUser.name,
          role: editingUser.role,
          permissions: editingUser.permissions,
        };
        await updateDoc(doc(db, 'users', editingUser.uid!), updatedUser);
        
        if (editingUser.password) {
           alert("User details saved. Note: Password cannot be updated from here due to security restrictions. The user must use 'Forgot Password' or you can delete and recreate them.");
        }
      }
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user? (Note: This will only revoke their app access, not their authentication record due to security restrictions)')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err: any) {
      alert(err.message);
    }
  };`;

content = content.replace(oldHandlers, newHandlers);

// Update password input type from "password" to "text"
content = content.replace(
  `type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})}`,
  `type="text" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})}`
);

fs.writeFileSync('src/components/UserManagement.tsx', content);
