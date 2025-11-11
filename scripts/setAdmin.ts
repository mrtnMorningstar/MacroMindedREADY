import { config } from "dotenv";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";

config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    "Missing admin credentials. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set."
  );
}

const ADMIN_UID = process.argv[2];

if (!ADMIN_UID) {
  throw new Error("Usage: ts-node scripts/setAdmin.ts <uid>");
}

const app = getApps().length
  ? getApp()
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  await db.doc(`users/${ADMIN_UID}`).set({ role: "admin" }, { merge: true });
  await auth.setCustomUserClaims(ADMIN_UID, { admin: true });
  console.log(`✅ Grant admin role and claim to ${ADMIN_UID}`);
}

void main().catch((error) => {
  console.error("Failed to assign admin:", error);
  process.exit(1);
});

