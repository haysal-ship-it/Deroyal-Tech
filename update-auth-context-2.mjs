import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');
code = code.replace(
`  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...newData });
    // In this app, users can't edit their own roles or permissions, only their name
    // (If they are admin, they edit in Settings)
  };`,
`  const updateUser = async (newData: Partial<User>) => {
    if (!user) return;
    try {
      const res = await fetch(\`/api/users/\${user.uid}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, ...newData })
      });
      if (res.ok) {
        setUser({ ...user, ...newData });
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user');
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };`);
fs.writeFileSync('src/context/AuthContext.tsx', code);
