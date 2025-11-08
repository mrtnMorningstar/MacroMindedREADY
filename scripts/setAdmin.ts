import { config } from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase config env vars: ${missingKeys.join(", ")}`
  );
}

const ADMIN_UID = "71EgfWqyQOPQOvtE1MrJNV9wLxQ2";

async function main() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  await setDoc(
    doc(db, "users", ADMIN_UID),
    {
      role: "admin",
    },
    { merge: true }
  );

  console.log(`✅ Set role=admin for user ${ADMIN_UID}`);
}

void main().catch((error) => {
  console.error("Failed to set admin role:", error);
  process.exit(1);
});

