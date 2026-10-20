import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  Plus, 
  X, 
  Eye, 
  EyeOff, 
  Shield, 
  UserCheck, 
  UserX, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Clock
} from 'lucide-react';
import { User, Role, Permissions, ROLE_PERMISSION_TEMPLATES, useAuth } from '../context/AuthContext';
import { db, secondaryAuth } from '../lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { logActivity } from '../lib/activityLogger';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

export default function UserManagement() {
  const { user: currentUser, getIdToken } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit / Create modal state
  const [editingUser, setEditingUser] = useState<(Partial<User> & {
    isNew?: boolean;
    password?: string;
    confirmPassword?: string;
  }) | null>(null);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset password modal state
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNew, setShowResetNew] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList: User[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const role = (data.role as Role) || 'Sales Officer';
        const permissions = data.permissions || ROLE_PERMISSION_TEMPLATES[role] || ROLE_PERMISSION_TEMPLATES['Sales Officer'];
        userList.push({
          uid: docSnap.id,
          active: data.active !== false,
          ...data,
          role,
          permissions
        } as User);
      });
      // Sort: Admins first, then by name
      userList.sort((a, b) => {
        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
        if (a.role !== 'Admin' && b.role === 'Admin') return 1;
        return (a.name || a.username || '').localeCompare(b.name || b.username || '');
      });
      setUsers(userList);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute active Admins count for guardrails
  const activeAdmins = users.filter(u => u.role === 'Admin' && u.active !== false);

  const handleRoleChange = (newRole: Role) => {
    if (!editingUser) return;
    // Guardrail: Cannot demote the last active Admin
    if (!editingUser.isNew && editingUser.role === 'Admin' && newRole !== 'Admin') {
      if (activeAdmins.length <= 1 && editingUser.active !== false) {
        setFormError('Cannot change the role of the last active Admin account.');
        return;
      }
    }
    setFormError(null);
    setEditingUser({
      ...editingUser,
      role: newRole,
      // Choosing a role in the form must update the permission dropdowns immediately!
      permissions: { ...ROLE_PERMISSION_TEMPLATES[newRole] }
    });
  };

  const handleOpenAddUser = () => {
    const defaultRole: Role = 'Sales Officer';
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingUser({
      isNew: true,
      username: '',
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: defaultRole,
      active: true,
      // Never end up with all permissions "None" by default
      permissions: { ...ROLE_PERMISSION_TEMPLATES[defaultRole] }
    });
  };

  const handleOpenEditUser = (u: User) => {
    setFormError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingUser({
      isNew: false,
      uid: u.uid,
      username: u.username || '',
      email: u.email || '',
      name: u.name || '',
      role: u.role || 'Sales Officer',
      active: u.active !== false,
      permissions: { ...(u.permissions || ROLE_PERMISSION_TEMPLATES[u.role || 'Sales Officer']) }
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);

    // 1. Username Validation: lowercase, no spaces, required
    const cleanUsername = (editingUser.username || '').trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setFormError('Username is required and must be at least 3 characters (lowercase, no spaces).');
      return;
    }

    // Check uniqueness
    const duplicate = users.find(u => 
      u.uid !== editingUser.uid && 
      (u.username || '').toLowerCase() === cleanUsername
    );
    if (duplicate) {
      setFormError(`Username "${cleanUsername}" is already taken. Please choose another.`);
      return;
    }

    // 2. Email Validation: optional
    const cleanEmail = (editingUser.email || '').trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Please enter a valid email address, or leave it blank.');
      return;
    }

    // 3. New User Password Validation
    if (editingUser.isNew) {
      if (!editingUser.password || editingUser.password.length < 8) {
        setFormError('Password is required and must be at least 8 characters long.');
        return;
      }
      if (editingUser.password !== editingUser.confirmPassword) {
        setFormError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = await getIdToken();

      if (editingUser.isNew) {
        let created = false;
        try {
          const res = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              username: cleanUsername,
              email: cleanEmail,
              name: editingUser.name || '',
              role: editingUser.role,
              permissions: editingUser.permissions,
              password: editingUser.password
            })
          });
          const data = await res.json();
          if (res.ok) {
            created = true;
          }
        } catch (_) {}

        if (!created) {
          const authEmail = cleanEmail || `${cleanUsername}@${(firebaseConfig as any)?.authDomain || 'internal.app'}`;
          let cred;
          try {
            cred = await createUserWithEmailAndPassword(secondaryAuth, authEmail, editingUser.password!);
          } catch (authErr: any) {
            if (authErr.code === 'auth/email-already-in-use') {
              throw new Error(`The username "${cleanUsername}" or email is already registered.`);
            } else if (authErr.code === 'auth/weak-password') {
              throw new Error('Password must be at least 8 characters long.');
            } else {
              throw authErr;
            }
          }

          const newUser = {
            username: cleanUsername,
            email: cleanEmail,
            authEmail,
            name: editingUser.name || '',
            role: editingUser.role || 'Sales Officer',
            permissions: editingUser.permissions || ROLE_PERMISSION_TEMPLATES[editingUser.role || 'Sales Officer'],
            active: true,
            createdAt: serverTimestamp()
          };

          await setDoc(doc(db, 'users', cred.user.uid), newUser);

          await logActivity({
            action: 'User Created',
            actorUid: currentUser?.uid || 'admin',
            actorName: currentUser?.name || currentUser?.username || 'Admin',
            actorRole: currentUser?.role || 'Admin',
            targetId: cred.user.uid,
            targetName: editingUser.name || cleanUsername,
            details: `Created user ${editingUser.name || cleanUsername} (@${cleanUsername}) with role ${editingUser.role}`
          });
        }

        showToast('success', `User @${cleanUsername} created successfully.`);
      } else {
        // Update user
        const targetUid = editingUser.uid!;
        const updatedData: any = {
          username: cleanUsername,
          email: cleanEmail,
          name: editingUser.name || '',
          role: editingUser.role,
          permissions: editingUser.permissions,
          active: editingUser.active !== false
        };

        await updateDoc(doc(db, 'users', targetUid), updatedData);

        // Record activity log
        await logActivity({
          action: 'User Updated',
          actorUid: currentUser?.uid || 'admin',
          actorName: currentUser?.name || currentUser?.username || 'Admin',
          actorRole: currentUser?.role || 'Admin',
          targetId: targetUid,
          targetName: editingUser.name || cleanUsername,
          details: `Updated profile & permissions for @${cleanUsername} (${editingUser.role})`
        });

        showToast('success', `User @${cleanUsername} updated successfully.`);
      }

      setEditingUser(null);
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    const isActivating = u.active === false;

    // Guardrail 1: Block users from deactivating themselves
    if (!isActivating && currentUser?.uid === u.uid) {
      showToast('error', 'You cannot deactivate your own account.');
      return;
    }

    // Guardrail 2: Block deactivating the last active Admin
    if (!isActivating && u.role === 'Admin' && activeAdmins.length <= 1) {
      showToast('error', 'Cannot deactivate the last active Admin account.');
      return;
    }

    const actionText = isActivating ? 'reactivate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${actionText} user "${u.name || u.username}"?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'users', u.uid), {
        active: isActivating
      });

      await logActivity({
        action: isActivating ? 'User Reactivated' : 'User Deactivated',
        actorUid: currentUser?.uid || 'admin',
        actorName: currentUser?.name || currentUser?.username || 'Admin',
        actorRole: currentUser?.role || 'Admin',
        targetId: u.uid,
        targetName: u.name || u.username,
        details: `${isActivating ? 'Reactivated' : 'Deactivated'} user account @${u.username}`
      });

      showToast('success', `User @${u.username} has been ${isActivating ? 'reactivated' : 'deactivated'}.`);
    } catch (err: any) {
      showToast('error', err.message || `Failed to ${actionText} user`);
    }
  };

  const handleOpenResetPassword = (u: User) => {
    setResettingUser(u);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setShowResetNew(false);
    setShowResetConfirm(false);
    setResetError(null);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setResetError(null);

    if (resetNewPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setIsResetting(true);
    try {
      const token = await getIdToken();
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: resettingUser.uid,
          newPassword: resetNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      showToast('success', `Password for @${resettingUser.username} has been reset.`);
      setResettingUser(null);
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const getPermissionSummary = (permissions?: Permissions) => {
    if (!permissions) return '0 of 4 modules';
    const modules: (keyof Permissions)[] = ['Dashboard', 'Sales', 'Repair', 'Settings'];
    const activeCount = modules.filter(m => permissions[m] && permissions[m] !== 'None').length;
    return `${activeCount} of 4 modules`;
  };

  const formatLastLogin = (lastLogin: any) => {
    if (!lastLogin) return 'Never';
    try {
      const date = lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
      return format(date, 'MMM d, yyyy · h:mm a');
    } catch {
      return 'Never';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-1 flex items-center gap-2">
            <Shield size={20} className="text-[#0561FC]" />
            Staff & User Management
          </h2>
          <p className="text-gray-500 text-[14px]">
            Assign system roles, configure granular module permissions, and manage staff access.
          </p>
        </div>
        <button 
          onClick={handleOpenAddUser}
          className="flex items-center justify-center gap-2 bg-[#0561FC] hover:shadow-[0_0_15px_rgba(5,97,252,0.3)] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {users.map(u => {
                const isSelf = currentUser?.uid === u.uid;
                const isLastAdmin = u.role === 'Admin' && u.active !== false && activeAdmins.length <= 1;

                return (
                  <tr key={u.uid} className={cn("hover:bg-gray-50/80 transition-colors", u.active === false ? "bg-gray-50/50 opacity-80" : "")}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm",
                          u.role === 'Admin' ? "bg-purple-100 text-purple-700" :
                          u.role === 'Manager' ? "bg-blue-100 text-blue-700" :
                          u.role === 'Technician' ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        )}>
                          {u.name ? u.name.charAt(0).toUpperCase() : u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {u.name || u.username}
                            {isSelf && (
                              <span className="text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-200">You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">@{u.username}</div>
                          {u.email && (
                            <div className="text-[11px] text-gray-400">{u.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'Manager' ? 'bg-indigo-100 text-indigo-800' :
                        u.role === 'Technician' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      )}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {u.active !== false ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-gray-900">
                        {getPermissionSummary(u.permissions)}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {Object.entries(u.permissions || {})
                          .filter(([_, v]) => v !== 'None')
                          .map(([k, v]) => `${k} (${v})`)
                          .join(', ') || 'No access'}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        {formatLastLogin(u.lastLogin)}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleOpenEditUser(u)} 
                          className="p-1.5 text-gray-400 hover:text-[#0561FC] hover:bg-blue-50 rounded transition-colors" 
                          title="Edit User & Permissions"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleOpenResetPassword(u)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>

                        <button 
                          onClick={() => handleToggleActive(u)} 
                          disabled={isSelf || isLastAdmin}
                          className={cn(
                            "p-1.5 rounded transition-colors",
                            isSelf || isLastAdmin 
                              ? "text-gray-300 cursor-not-allowed" 
                              : u.active !== false 
                                ? "text-gray-400 hover:text-red-600 hover:bg-red-50" 
                                : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                          )}
                          title={
                            isSelf ? "You cannot deactivate yourself" :
                            isLastAdmin ? "Cannot deactivate the last active Admin" :
                            u.active !== false ? "Deactivate User" : "Reactivate User"
                          }
                        >
                          {u.active !== false ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">
                    No users found. Click "Add User" above to create an account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingUser.isNew ? 'Create New Staff Account' : `Edit User: ${editingUser.name || editingUser.username}`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingUser.isNew ? 'Set credentials, role, and custom module access.' : 'Update user profile and fine-tune module access.'}
                </p>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Username *</label>
                  <input 
                    type="text" 
                    value={editingUser.username || ''} 
                    onChange={e => setEditingUser({
                      ...editingUser, 
                      username: e.target.value.toLowerCase().replace(/\s+/g, '')
                    })} 
                    placeholder="e.g. johndoe"
                    required
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 font-mono focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100" 
                  />
                  <p className="text-[11px] text-gray-400">Lowercase, no spaces. Used for login.</p>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    value={editingUser.email || ''} 
                    onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
                    placeholder="e.g. john@company.ng"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100" 
                  />
                  <p className="text-[11px] text-gray-400">Optional staff contact email.</p>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Full Name</label>
                  <input 
                    type="text" 
                    value={editingUser.name || ''} 
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100" 
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Role *</label>
                  <select 
                    value={editingUser.role} 
                    onChange={e => handleRoleChange(e.target.value as Role)} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100 font-medium"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Sales Officer">Sales Officer</option>
                    <option value="Technician">Technician</option>
                  </select>
                  <p className="text-[11px] text-gray-400">Applies default permissions immediately.</p>
                </div>

                {/* Password fields (New users only) */}
                {editingUser.isNew && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Password *</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          value={editingUser.password || ''} 
                          onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                          placeholder="Min 8 characters"
                          required
                          minLength={8}
                          className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-700">Confirm Password *</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={editingUser.confirmPassword || ''} 
                          onChange={e => setEditingUser({...editingUser, confirmPassword: e.target.value})} 
                          placeholder="Re-enter password"
                          required
                          minLength={8}
                          className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Account Status for existing users */}
                {!editingUser.isNew && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-700">Account Status</label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="account_status"
                          checked={editingUser.active !== false}
                          onChange={() => setEditingUser({...editingUser, active: true})}
                          className="text-[#0561FC] focus:ring-[#0561FC]"
                        />
                        <span className="font-medium text-emerald-700">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="account_status"
                          checked={editingUser.active === false}
                          onChange={() => {
                            if (currentUser?.uid === editingUser.uid) {
                              setFormError('You cannot deactivate your own account.');
                              return;
                            }
                            if (editingUser.role === 'Admin' && activeAdmins.length <= 1) {
                              setFormError('Cannot deactivate the last active Admin account.');
                              return;
                            }
                            setEditingUser({...editingUser, active: false});
                          }}
                          className="text-red-600 focus:ring-red-600"
                        />
                        <span className="font-medium text-gray-500">Deactivated</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Module Permissions (Granular overrides) */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Module Permissions</h4>
                    <p className="text-[11px] text-gray-500">Fine-tune individual permissions for this user.</p>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {getPermissionSummary(editingUser.permissions)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['Dashboard', 'Sales', 'Repair', 'Settings'] as (keyof Permissions)[]).map(mod => (
                    <div key={mod} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{mod}</span>
                        <div className="text-[10px] text-gray-500">
                          {mod === 'Dashboard' && 'Overview & business KPIs'}
                          {mod === 'Sales' && 'Invoices, POS & receipts'}
                          {mod === 'Repair' && 'Repair jobs & tracking'}
                          {mod === 'Settings' && 'Staff management & branding'}
                        </div>
                      </div>
                      <select 
                        value={(editingUser.permissions as any)?.[mod] || 'None'} 
                        onChange={e => setEditingUser({
                          ...editingUser, 
                          permissions: { ...editingUser.permissions, [mod]: e.target.value } as any
                        })}
                        className={cn(
                          "text-xs px-2.5 py-1.5 border rounded-lg bg-white outline-none font-medium transition-all",
                          (editingUser.permissions as any)?.[mod] === 'Full' ? "border-emerald-300 text-emerald-800 bg-emerald-50/50" :
                          (editingUser.permissions as any)?.[mod] === 'View' ? "border-blue-300 text-blue-800 bg-blue-50/50" :
                          "border-gray-200 text-gray-600"
                        )}
                      >
                        <option value="None">None</option>
                        <option value="View">View Only</option>
                        <option value="Full">Full Access</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)} 
                  className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0561FC] hover:bg-blue-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingUser.isNew ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resettingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Reset Password</h3>
                  <p className="text-xs text-gray-500">For @{resettingUser.username} ({resettingUser.name})</p>
                </div>
              </div>
              <button 
                onClick={() => setResettingUser(null)} 
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
              {resetError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">New Password *</label>
                <div className="relative">
                  <input
                    type={showResetNew ? "text" : "password"}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetNew(!showResetNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showResetNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showResetConfirm ? "text" : "password"}
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={8}
                    className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#0561FC] focus:ring-2 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(!showResetConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showResetConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg font-medium text-xs hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-4 py-2 bg-[#0561FC] hover:bg-blue-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isResetting && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
