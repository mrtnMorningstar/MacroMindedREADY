"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { motion } from "framer-motion";
import { collection, getDocs, type DocumentData } from "firebase/firestore";
import Link from "next/link";

import { db } from "@/lib/firebase";

type UserCard = {
  id: string;
  name: string;
  email: string;
  packageTier: string | null;
  mealPlanStatus: string;
  createdAt?: Date | null;
};

const variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const packageFilters = ["All", "Basic", "Pro", "Elite"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof packageFilters)[number]>("All");

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const records: UserCard[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data() as DocumentData;
            if (data?.role === "admin") return null;

            const createdAt = data?.createdAt;
            let createdAtDate: Date | null = null;
            if (createdAt?.toDate) {
              createdAtDate = createdAt.toDate();
            } else if (createdAt instanceof Date) {
              createdAtDate = createdAt;
            }

            return {
              id: docSnapshot.id,
              name: data?.displayName ?? "Unnamed User",
              email: data?.email ?? "No email",
              packageTier: data?.packageTier ?? null,
              mealPlanStatus: data?.mealPlanStatus ?? "Not Started",
              createdAt: createdAtDate,
            };
          })
          .filter(Boolean) as UserCard[];

        setUsers(records);
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "All" ||
        (user.packageTier ?? "Unknown").toLowerCase() === filter.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [users, filter, search]);

  const daysSince = useCallback((createdAt?: Date | null) => {
    if (!createdAt) return "—";
    const diffMs = Date.now() - createdAt.getTime();
    if (diffMs < 0) return "0";
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)).toString();
  }, []);

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-background px-6 py-10 text-foreground sm:py-14 lg:px-10">
      <motion.header
        initial="hidden"
        animate="visible"
        variants={variants}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
            Athlete Directory
          </h1>
          <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
            Browse and manage users currently enrolled in MacroMinded programs.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-3 py-2">
            <input
              value={search}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setSearch(event.target.value)
              }
              placeholder="Search by name or email…"
              className="w-48 bg-transparent text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground placeholder:text-foreground/40 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 rounded-full border border-border/70 bg-background/40 px-3 py-2">
            {packageFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.28em] transition ${
                  filter === item
                    ? "border border-accent bg-accent text-background"
                    : "text-foreground/60 hover:text-accent"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </motion.header>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-3xl border border-border/80 bg-muted/40"
            />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-10 text-center text-xs font-medium uppercase tracking-[0.3em] text-foreground/50">
          No users found matching the current filters.
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={variants}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              whileHover={{ scale: 1.02 }}
              variants={variants}
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
                Meal Plan Status: {user.mealPlanStatus}
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
                Days Since Signup: {daysSince(user.createdAt)}
              </div>
              <div className="mt-auto flex justify-end">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
                >
                  View Profile
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

