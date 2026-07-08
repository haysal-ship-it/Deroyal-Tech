import fs from 'fs';
let code = fs.readFileSync('src/components/Layout.tsx', 'utf-8');
code = code.replace(
`  const MAIN_MENU = [
    ...(user?.role === 'Admin' ? [{ label: "Dashboard", path: "/", icon: Layout01Icon }] : []),
    { label: "Sales", path: "/sales", icon: ShoppingCart01Icon },
    { label: "Repairs", path: "/repairs", icon: Wrench01Icon },
  ];`,
`  const MAIN_MENU = [
    ...(user?.permissions?.Dashboard !== 'None' ? [{ label: "Dashboard", path: "/", icon: Layout01Icon }] : []),
    ...(user?.permissions?.Sales !== 'None' ? [{ label: "Sales", path: "/sales", icon: ShoppingCart01Icon }] : []),
    ...(user?.permissions?.Repair !== 'None' ? [{ label: "Repairs", path: "/repairs", icon: Wrench01Icon }] : []),
  ];`);
fs.writeFileSync('src/components/Layout.tsx', code);
