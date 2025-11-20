"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Navbar() {
  const { firebaseUser, isAdmin, hasPackage, loading } = useUser();
  const router = useRouter();

  if (loading) {
    return null; // or return a skeleton
  }

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <nav className="bg-black text-white px-4 py-3 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        MacroMinded
      </Link>

      <div className="space-x-4">
        {!firebaseUser && (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}

        {firebaseUser && !isAdmin && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            {!hasPackage && <Link href="/packages">Plans</Link>}
            <button onClick={handleSignOut} className="text-red-500">
              Logout
            </button>
          </>
        )}

        {firebaseUser && isAdmin && (
          <>
            <Link href="/admin">Admin Panel</Link>
            <button onClick={handleSignOut} className="text-red-500">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
