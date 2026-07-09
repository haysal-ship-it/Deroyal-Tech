import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "haysal618@gmail.com", "password123");
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    console.log("haysal618 doc:", userDoc.data());
    process.exit(0);
  } catch(e) {
    try {
      const cred = await signInWithEmailAndPassword(auth, "admin@example.com", "admin123");
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      console.log("admin@example doc:", userDoc.data());
      process.exit(0);
    } catch(e2) {
      console.error(e2);
      process.exit(1);
    }
  }
}
run();
