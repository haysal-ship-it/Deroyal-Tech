import fs from 'fs';
let content = fs.readFileSync('src/components/DashboardCharts.tsx', 'utf8');

// Replace `${(value / 1000).toFixed(0)}k` with `₦${(value / 1000).toFixed(0)}k`
content = content.replace(/\`\$\{\(value \/ 1000\)\.toFixed\(0\)\}k\`/g, '\`₦${(value / 1000).toFixed(0)}k\`');

fs.writeFileSync('src/components/DashboardCharts.tsx', content);
