import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Replace >$ with >₦
  content = content.replace(/>\$/g, '>₦');
  // Replace "$ with "₦
  content = content.replace(/"\$/g, '"₦');
  // Replace '$ with '₦
  content = content.replace(/'\$/g, "'₦");
  
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/components/InvoiceModal.tsx',
  'src/components/DashboardCharts.tsx',
  'src/pages/Repairs.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Sales.tsx'
];

files.forEach(f => {
  replaceInFile(f);
  console.log(`Updated ${f}`);
});
