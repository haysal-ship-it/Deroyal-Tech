import fs from 'fs';

const files = ['src/pages/Sales.tsx', 'src/pages/Repairs.tsx', 'src/pages/Dashboard.tsx'];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(
    /\(error\) => \{\n\s*console\.error\(".*?", error\);\n\s*\}\)/g,
    `(error) => {
      if (error.code !== 'permission-denied') {
        console.error("Snapshot error:", error);
      }
    })`
  );
  
  // Dashboard had a different format in my patch_dashboard.mjs: 
  content = content.replace(
    /const unsubSales = onSnapshot\(qSales, \(snap\) => \{[\s\S]*?\}\);/g,
    `const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'sale' })));
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });`
  );

  content = content.replace(
    /const unsubRepairs = onSnapshot\(qRepairs, \(snap\) => \{[\s\S]*?\}\);/g,
    `const unsubRepairs = onSnapshot(qRepairs, (snap) => {
      setRepairs(snap.docs.map(d => ({ id: d.id, ...d.data(), _type: 'repair' })));
    }, (error) => {
      if (error.code !== 'permission-denied') console.error(error);
    });`
  );

  fs.writeFileSync(f, content);
});
