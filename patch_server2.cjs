const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const startIdx = content.indexOf('// User Management (Admin only)');
const endIdx = content.indexOf('async function startServer() {');

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + content.substring(endIdx);
  fs.writeFileSync('server.ts', content);
}
