import fs from 'fs';
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
if (!content.includes('secondaryApp')) {
  content = content.replace(
    "export const auth = getAuth(app);",
    "export const auth = getAuth(app);\nexport const secondaryApp = initializeApp(firebaseConfig, 'Secondary');\nexport const secondaryAuth = getAuth(secondaryApp);"
  );
  fs.writeFileSync('src/lib/firebase.ts', content);
}
