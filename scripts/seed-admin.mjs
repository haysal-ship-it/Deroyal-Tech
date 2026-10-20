import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error("firebase-applet-config.json not found.");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

const email = process.argv[2] || 'admin@example.com';
const password = process.argv[3] || 'admin123';
const name = process.argv[4] || 'Administrator';

async function seedFirstAdmin() {
  console.log('Checking if system has already been initialized...');
  
  // Check if system initialization doc exists
  try {
    const initDoc = await getDoc(doc(db, 'settings', 'initialized'));
    if (initDoc.exists()) {
      console.error('Abort: System is already initialized. A setup has already been completed.');
      process.exit(1);
    }
  } catch (err) {
    // If permission denied or doesn't exist, proceed to check
  }

  console.log(`Seeding initial admin account: ${email}`);

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      try {
        cred = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr) {
        console.error('Account already exists in Auth, but could not authenticate with provided password.');
        process.exit(1);
      }
    } else {
      console.error('Failed to create admin in Firebase Auth:', err.message);
      process.exit(1);
    }
  }

  const uid = cred.user.uid;
  const adminData = {
    username: 'admin',
    email: email.includes('@example.com') ? '' : email,
    authEmail: email,
    name: name,
    role: 'Admin',
    active: true,
    mustChangePassword: true,
    permissions: {
      Dashboard: 'Full',
      Sales: 'Full',
      Repair: 'Full',
      Settings: 'Full'
    },
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'users', uid), adminData);
    await setDoc(doc(db, 'settings', 'initialized'), {
      initializedAt: new Date().toISOString(),
      adminUid: uid
    });
    console.log(`Initial admin (${email}) seeded successfully!`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create user document in Firestore:', err.message);
    process.exit(1);
  }
}

seedFirstAdmin();
