import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf-8');
code = code.replace(
`export interface User {
  uid: string;
  username: string;
  name: string;
  role: Role;
  permissions: Permissions;
}`,
`export interface User {
  uid: string;
  username: string;
  name: string;
  role: Role;
  permissions: Permissions;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}`);
fs.writeFileSync('src/context/AuthContext.tsx', code);
