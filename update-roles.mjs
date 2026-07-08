import fs from 'fs';
const files = [
  'src/pages/Login.tsx',
  'src/components/Layout.tsx',
  'src/components/ProtectedRoute.tsx'
];
for (const file of files) {
  let code = fs.readFileSync(file, 'utf-8');
  code = code.replace(/role === 'admin'/g, "role === 'Admin'");
  code = code.replace(/role === "admin"/g, "role === 'Admin'");
  fs.writeFileSync(file, code);
}
