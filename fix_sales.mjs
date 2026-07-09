import fs from 'fs';
let content = fs.readFileSync('src/pages/Sales.tsx', 'utf8');

const regex = /\{(\['Card', 'Cash', 'Transfer'\])\.map\(\(method\) => \([\s\S]*?\)\)\}\s*className="h-10 px-6 border border-\[#E5E5E5\] rounded-lg text-sm font-medium text-\[#1A1A1A\] hover:bg-\[#F5F5F5\] focus:border-\[#1A1A1A\] focus:bg-\[#F5F5F5\] transition-colors">\s*\{method\}\s*<\/button>\s*\)\)\}/;
content = content.replace(regex, 
`{['Card', 'Cash', 'Transfer'].map((method) => (
                  <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={\`h-10 px-6 border rounded-lg text-sm font-medium transition-colors \${paymentMethod === method ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#E5E5E5] text-[#1A1A1A] hover:bg-[#F5F5F5]'}\`}>
                    {method}
                  </button>
                ))}`);

fs.writeFileSync('src/pages/Sales.tsx', content);
