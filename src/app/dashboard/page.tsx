"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
            <p className="text-sm text-zinc-600">
              {user?.email ? `Signed in as ${user.email}` : "Signed in"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-6 py-10">
        <div className="rounded-lg border border-dashed border-emerald-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-zinc-900">
            You&apos;re ready to build.
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            This page is protected by Firebase Authentication. Start building
            your product by adding components, connecting Firestore, or
            uploading files with Firebase Storage.
          </p>
        </div>
      </main>
    </div>
  );
}


