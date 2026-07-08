import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf-8');
code = code.replace(/role === 'sales'/g, "permissions?.Dashboard === 'None'");
code = code.replace(/allowedRoles=\{\['admin'\]\}/g, "allowedRoles={['Admin']}");
fs.writeFileSync('src/App.tsx', code);
