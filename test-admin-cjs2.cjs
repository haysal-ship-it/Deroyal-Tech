const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
try {
  initializeApp();
  const db = getFirestore();
  console.log("Admin initialized successfully in CJS with modular imports");
} catch (e) {
  console.log("Failed to initialize:", e);
}
