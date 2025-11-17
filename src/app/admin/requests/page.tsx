"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { collection, onSnapshot, doc, getDoc, type DocumentData } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

import { auth, db } from "@/lib/firebase";
import { AdminSidebar, useSidebar } from "@/components/admin";

type PendingUser = {
  id: string;
  name: string;
  email: string;
  packageTier: string | null;
  mealPlanStatus: string;
  createdAt?: Date | null;
};

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const baseBackground = "bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_60%,#000_98%)]";

export default function AdminRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }
      try {
        const docRef = doc(db, "users", currentUser.uid);
        const currentSnapshot = await getDoc(docRef);
        const role = currentSnapshot.data()?.role;

        if (role !== "admin") {
          router.replace("/dashboard");
          setCheckingAuth(false);
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Failed to verify admin role:", error);
        router.replace("/dashboard");
        setCheckingAuth(false);
        return;
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const pending: PendingUser[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data() as DocumentData;
            const status = data?.mealPlanStatus ?? "Not Started";
            if (data?.role === "admin") return null;
            if (!status || status === "Delivered") return null;

            const createdAt = data?.createdAt?.toDate
              ? data.createdAt.toDate()
              : data?.createdAt instanceof Date
              ? data.createdAt
              : null;

            return {
              id: docSnapshot.id,
              name: data?.displayName ?? "Unnamed User",
              email: data?.email ?? "No email",
              packageTier: data?.packageTier ?? null,
              mealPlanStatus: status,
              createdAt,
            } as PendingUser;
          })
          .filter(Boolean) as PendingUser[];

        setUsers(pending);
        setLoading(false);
      },
      (fetchError) => {
        console.error("Failed to fetch pending users", fetchError);
        setError("Unable to load plan requests.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const getDaysSince = useMemo(
    () =>
      (date?: Date | null) => {
        if (!date) return "—";
        const diffMs = Date.now() - date.getTime();
        if (diffMs < 0) return "0";
        return Math.floor(diffMs / (1000 * 60 * 60 * 24)).toString();
      },
    []
  );

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Validating access...
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />

      <div className={`relative isolate flex-1 transition-all duration-300 ${!isMobile && isOpen ? "lg:ml-64" : ""}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.1 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
          <div className={`absolute inset-0 ${baseBackground}`} />
        </motion.div>

        <div className="relative flex flex-col gap-10 px-6 py-10 sm:py-16 lg:px-10">
          <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
                Plan Requests
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Clients awaiting meal plan delivery or updates.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                Pending: {users.length}
              </div>
              <button
                type="button"
                onClick={async () => {
                  await auth.signOut();
                  router.replace("/login");
                }}
                className="rounded-full border border-accent bg-accent px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent"
              >
                Logout
              </button>
            </div>
          </header>

      {error && (
        <div className="rounded-3xl border border-border/70 bg-muted/70 px-6 py-4 text-center text-xs font-medium uppercase tracking-[0.28em] text-foreground/70">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-border/80 bg-muted/40"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-10 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/50">
          All caught up! No pending requests right now.
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {users.map((user) => (
            <motion.div
              key={user.id}
              whileHover={{ scale: 1.02 }}
              className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-35px_rgba(215,38,61,0.6)] backdrop-blur"
            >
              <div>
                <h3 className="font-bold uppercase tracking-[0.34em] text-foreground">
                  {user.name}
                </h3>
                <p className="mt-1 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-foreground/60">
                  {user.email}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                Package Tier: {user.packageTier ?? "Not assigned"}
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                Status: {user.mealPlanStatus}
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                Days Since Signup: {getDaysSince(user.createdAt)}
              </div>
              <div className="mt-auto flex justify-end">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
                >
                  Go to Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
        </div>
      </div>
    </div>
  );
}
