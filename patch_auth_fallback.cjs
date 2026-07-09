const fs = require('fs');
let content = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');
content = content.replace(
  'setUser({ uid: userCredential.user.uid, ...userDoc.data() } as User);',
  `const data = userDoc.data();
        // Fallback for missing permissions
        if (!data.permissions && data.role === 'Admin') {
          data.permissions = { Dashboard: 'Full', Sales: 'Full', Repair: 'Full', Settings: 'Full' };
        }
        setUser({ uid: userCredential.user.uid, ...data } as User);`
);
fs.writeFileSync('src/context/AuthContext.tsx', content);
