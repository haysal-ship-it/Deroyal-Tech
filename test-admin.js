import admin from 'firebase-admin';
try {
  admin.initializeApp();
  console.log("Admin initialized successfully");
} catch (e) {
  console.log("Failed to initialize:", e);
}
