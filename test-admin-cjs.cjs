const admin = require('firebase-admin');
try {
  admin.initializeApp();
  const db = admin.firestore();
  console.log("Admin initialized successfully in CJS");
} catch (e) {
  console.log("Failed to initialize:", e);
}
