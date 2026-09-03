import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Loader2, Save, X } from 'lucide-react';
import { useAuth, User, Role, AccessLevel } from '../context/AuthContext';
import { auth, db } from '../lib/firebase';
import { collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth } from '../lib/firebase';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string, isNew?: boolean } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList: User[] = [];
      snapshot.forEach(doc => {
        userList.push({ uid: doc.id, ...doc.data() } as User);
      });
      setUsers(userList);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      let email = editingUser.username || '';
      if (email && !email.includes('@')) {
        email = `${email}@example.com`;
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-lg font-medium text-gray-900 mb-1">User Management</h2>
           <p className="text-gray-500 text-[14px]">Create and manage user accounts and permissions.</p>
        </div>
        <button 
          onClick={() => setEditingUser({
            isNew: true,
            username: '',
            password: '',
            name: '',
            role: 'Sales Officer',
            permissions: { Dashboard: 'None', Sales: 'None', Repair: 'None', Settings: 'None' }
          })}
          className="flex items-center gap-2 bg-[#0561FC] hover:shadow-[0_0_15px_rgba(5,97,252,0.3)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">{editingUser.isNew ? 'Create New User' : 'Edit User'}</h3>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Username / Email</label>
                  <input type="text" value={editingUser.username || ''} onChange={e => setEditingUser({...editingUser, username: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{editingUser.isNew ? 'Password' : 'New Password (leave blank to keep current)'}</label>
                  <input type="text" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" value={editingUser.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <select value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as Role})} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]">
                    <option value="Admin">Admin</option>
                    <option value="Sales Officer">Sales Officer</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3 pb-2 border-b border-gray-100 text-gray-900">Module Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['Dashboard', 'Sales', 'Repair', 'Settings'].map(mod => (
                    <div key={mod} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <span className="text-sm font-medium text-gray-700">{mod}</span>
                      <select 
                        value={(editingUser.permissions as any)?.[mod] || 'None'} 
                        onChange={e => setEditingUser({
                          ...editingUser, 
                          permissions: { ...editingUser.permissions, [mod]: e.target.value } as any
                        })}
                        className="text-sm px-2 py-1 border border-gray-200 rounded bg-white text-gray-900 outline-none focus:border-[#0561FC] focus:ring-1 focus:ring-[#0561FC]"
                      >
                        <option value="None">None</option>
                        <option value="View">View</option>
                        <option value="Full">Full</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-md font-medium text-sm hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#0561FC] text-white rounded-md font-medium text-sm flex items-center gap-2 hover:shadow-[0_0_15px_rgba(5,97,252,0.3)]">
                <Save size={16} /> Save User
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Permissions</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(u => (
              <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.username}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                     {Object.entries(u.permissions || {}).map(([key, val]) => (
                        val !== 'None' && (
                          <span key={key} className="text-[10px] px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-600">
                            {key}: {val}
                          </span>
                        )
                     ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <button onClick={() => setEditingUser(u)} className="p-1.5 text-gray-400 hover:text-[#0561FC] transition-colors"><Pencil size={16} /></button>
                   <button onClick={() => handleDelete(u.uid)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors ml-2"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
