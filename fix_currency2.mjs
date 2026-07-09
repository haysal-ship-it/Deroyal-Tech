import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
content = content.replace(/""}\$/g, '""}₦');
fs.writeFileSync('src/pages/Dashboard.tsx', content);
