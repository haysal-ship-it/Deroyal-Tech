import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "admin@example.com", "admin123");
    await setDoc(doc(db, 'users', cred.user.uid), { 
      role: 'Admin',
      name: 'Admin User',
      username: 'admin@example.com',
      email: 'admin@example.com',
      permissions: {
        Dashboard: 'Full',
        Sales: 'Full',
        Repair: 'Full',
        Settings: 'Full'
      }
    }, { merge: true });
    console.log("Fixed!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
