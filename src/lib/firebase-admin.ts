import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Lazy initialization to avoid errors during build time
let adminApp: ReturnType<typeof initializeApp> | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

function initializeFirebaseAdmin() {
  if (adminApp) {
    return;
  }

  // During build time, environment variables may not be available
  // Skip initialization if credentials are missing (will fail at runtime if actually used)
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    // During build, just return without initializing
    // The error will be thrown at runtime if the functions are actually called
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn("Firebase Admin credentials not available during build. Initialization will happen at runtime.");
      return;
    }
    throw new Error(
      "Missing Firebase admin credentials. Ensure FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
    );
  }

  // Handle private key formatting - replace escaped newlines with actual newlines
  let privateKey = rawPrivateKey;
  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  // Ensure the private key has proper BEGIN/END markers if they're missing
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----") && !privateKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
    privateKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/-----BEGIN RSA PRIVATE KEY-----/g, "")
      .replace(/-----END RSA PRIVATE KEY-----/g, "")
      .trim();
    
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
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

  try {
    adminApp = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
    
    adminAuthInstance = getAuth(adminApp);
    adminDbInstance = getFirestore(adminApp);
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    throw new Error(
      `Firebase Admin initialization failed: ${error instanceof Error ? error.message : "Unknown error"}. Please verify your FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variables.`
    );
  }
}

// Lazy getters that initialize on first access
export function getAdminAuth(): Auth {
  initializeFirebaseAdmin();
  if (!adminAuthInstance) {
    throw new Error(
      "Firebase Admin Auth not initialized. Ensure FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
    );
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  initializeFirebaseAdmin();
  if (!adminDbInstance) {
    throw new Error(
      "Firebase Admin Firestore not initialized. Ensure FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
    );
  }
  return adminDbInstance;
}

// For backward compatibility, export as Proxy objects that initialize on first access
// This allows existing code to continue using adminAuth and adminDb directly
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    initializeFirebaseAdmin();
    if (!adminAuthInstance) {
      throw new Error(
        "Firebase Admin Auth not initialized. Ensure FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
      );
    }
    const value = (adminAuthInstance as any)[prop];
    if (typeof value === "function") {
      return value.bind(adminAuthInstance);
    }
    return value;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    initializeFirebaseAdmin();
    if (!adminDbInstance) {
      throw new Error(
        "Firebase Admin Firestore not initialized. Ensure FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and NEXT_PUBLIC_FIREBASE_PROJECT_ID are set."
      );
    }
    const value = (adminDbInstance as any)[prop];
    if (typeof value === "function") {
      return value.bind(adminDbInstance);
    }
    return value;
  },
});