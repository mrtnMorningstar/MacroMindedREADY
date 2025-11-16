/**
 * Safe script to assign admin role to a user.
 * Run locally with Node.js.
 *
 * Usage:
 *   node setAdminRole.js <USER_UID>
 *
 * Make sure you have your service account JSON file and set FIREBASE_ADMIN_SDK_PATH env variable.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Replace with your service account JSON file path
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_PATH || path.join(__dirname, "serviceAccountKey.json");

// Load service account key
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = process.argv[2];

if (!uid) {
  console.error("Usage: node setAdminRole.js <USER_UID>");
  process.exit(1);
}

async function setAdmin() {
  try {
    // Set custom claim for Storage rules
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Successfully set admin custom claim for UID: ${uid}`);
    
    // Also update Firestore user document with role
    const db = admin.firestore();
    await db.collection("users").doc(uid).set(
      { role: "admin" },
      { merge: true }
    );
    console.log(`✅ Successfully set admin role in Firestore for UID: ${uid}`);
    console.log("Custom claims will propagate to Storage rules within ~1 hour.");
    console.log("Firestore role is active immediately.");
  } catch (err) {
    console.error("❌ Error setting admin role:", err);
    process.exit(1);
  }
  
  process.exit(0);
}

setAdmin();
