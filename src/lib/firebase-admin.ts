import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !rawPrivateKey) {
  throw new Error(
    "Missing Firebase admin credentials. Ensure FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
  );
}

// Handle private key formatting - replace escaped newlines with actual newlines
let privateKey = rawPrivateKey;
if (privateKey.includes("\\n")) {
  privateKey = privateKey.replace(/\\n/g, "\n");
}

// Validate private key format
if (!privateKey.includes("-----BEGIN")) {
  throw new Error(
    "FIREBASE_PRIVATE_KEY must include BEGIN/END markers. Ensure the key is properly formatted."
  );
}

// Log credential info (without exposing sensitive data)
if (process.env.NODE_ENV === "development") {
  console.log("Firebase Admin initialization:", {
    projectId,
    clientEmail,
    privateKeyLength: privateKey.length,
    hasBeginMarker: privateKey.includes("-----BEGIN"),
    hasEndMarker: privateKey.includes("-----END"),
  });
}

let app;
try {
  app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
  throw new Error(
    `Firebase Admin initialization failed: ${error instanceof Error ? error.message : "Unknown error"}. Please verify your FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables.`
  );
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);


