"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { AdminSidebar, useSidebar } from "@/components/admin";
import { AdminTableSkeleton } from "@/components/skeletons";

type UserWizardData = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  macroWizardCompleted?: boolean | null;
  wizardVerified?: boolean | null;
  profile?: {
    age?: string | null;
    height?: string | null;
    weight?: string | null;
    gender?: string | null;
    activityLevel?: string | null;
    goal?: string | null;
    allergies?: string | null;
    likes?: string | null;
    dislikes?: string | null;
  } | null;
  estimatedMacros?: {
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fats?: number | null;
  } | null;
};

export default function AdminWizardPage() {
  const { isOpen } = useSidebar();
  const [users, setUsers] = useState<UserWizardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userData: UserWizardData[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            // Exclude admins
            if (data?.role === "admin") return null;
            return { id: d.id, ...data } as UserWizardData;
          })
          .filter((u): u is UserWizardData => u !== null);
        setUsers(userData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const verify = async (id: string) => {
    if (verifying) return;

    setVerifying(id);
    try {
      await updateDoc(doc(db, "users", id), {
        wizardVerified: true,
      });
    } catch (error) {
      console.error("Failed to verify wizard:", error);
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background text-foreground">
        <AdminSidebar />
        <div className={`flex-1 transition-all duration-300 ${isOpen ? "lg:ml-64" : "lg:ml-16"}`}>
          <div className="p-6">
            <AdminTableSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <div className={`flex-1 transition-all duration-300 ${isOpen ? "lg:ml-64" : "lg:ml-16"}`}>
        <div className="p-6 lg:p-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-3xl font-bold uppercase tracking-[0.32em] text-foreground"
          >
            Client Setup Wizard Status
          </motion.h1>

          <div className="space-y-6">
            {users.length === 0 ? (
              <div className="rounded-3xl border border-border/70 bg-muted/60 px-8 py-8 text-center text-xs font-semibold uppercase tracking-[0.3em] text-foreground/60">
                No users found
              </div>
            ) : (
              users.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_60px_-30px_rgba(215,38,61,0.6)] backdrop-blur"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold uppercase tracking-[0.28em] text-foreground mb-2">
                        {u.displayName || "Unnamed User"}
                      </h2>
                      {u.email && (
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60">
                          {u.email}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60 mb-1">
                        Wizard Completed:
                      </p>
                      <span
                        className={`text-sm font-bold uppercase tracking-[0.2em] ${
                          u.macroWizardCompleted ? "text-green-500" : "text-accent"
                        }`}
                      >
                        {u.macroWizardCompleted ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>

                  {u.profile && (
                    <div className="mb-4 rounded-2xl border border-border/70 bg-background/20 p-4">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-foreground">
                        Profile Information
                      </h3>
                      <div className="grid gap-2 text-xs uppercase tracking-[0.2em] text-foreground/80 sm:grid-cols-2">
                        {u.profile.age && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Age:</span>
                            <span>{u.profile.age}</span>
                          </div>
                        )}
                        {u.profile.height && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Height:</span>
                            <span>{u.profile.height} cm</span>
                          </div>
                        )}
                        {u.profile.weight && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Weight:</span>
                            <span>{u.profile.weight} kg</span>
                          </div>
                        )}
                        {u.profile.gender && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Gender:</span>
                            <span className="capitalize">{u.profile.gender}</span>
                          </div>
                        )}
                        {u.profile.activityLevel && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Activity:</span>
                            <span className="capitalize">{u.profile.activityLevel.replace("_", " ")}</span>
                          </div>
                        )}
                        {u.profile.goal && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Goal:</span>
                            <span className="capitalize">{u.profile.goal}</span>
                          </div>
                        )}
                        {u.profile.allergies && (
                          <div className="col-span-2 flex flex-col">
                            <span className="text-foreground/50 mb-1">Allergies:</span>
                            <span>{u.profile.allergies || "None"}</span>
                          </div>
                        )}
                        {u.profile.likes && (
                          <div className="col-span-2 flex flex-col">
                            <span className="text-foreground/50 mb-1">Foods They Like:</span>
                            <span>{u.profile.likes}</span>
                          </div>
                        )}
                        {u.profile.dislikes && (
                          <div className="col-span-2 flex flex-col">
                            <span className="text-foreground/50 mb-1">Foods They Dislike:</span>
                            <span>{u.profile.dislikes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {u.estimatedMacros && (
                    <div className="mb-4 rounded-2xl border border-border/70 bg-background/20 p-4">
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-foreground">
                        Estimated Macros
                      </h3>
                      <div className="grid gap-2 text-xs uppercase tracking-[0.2em] text-foreground/80 sm:grid-cols-2">
                        {u.estimatedMacros.calories && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Calories:</span>
                            <span className="font-bold text-accent">{u.estimatedMacros.calories}</span>
                          </div>
                        )}
                        {u.estimatedMacros.protein && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Protein:</span>
                            <span className="font-bold text-accent">{u.estimatedMacros.protein}g</span>
                          </div>
                        )}
                        {u.estimatedMacros.carbs && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Carbs:</span>
                            <span className="font-bold text-accent">{u.estimatedMacros.carbs}g</span>
                          </div>
                        )}
                        {u.estimatedMacros.fats && (
                          <div className="flex justify-between">
                            <span className="text-foreground/50">Fats:</span>
                            <span className="font-bold text-accent">{u.estimatedMacros.fats}g</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {u.macroWizardCompleted && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => verify(u.id)}
                        disabled={u.wizardVerified || verifying === u.id}
                        className={`rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] transition ${
                          u.wizardVerified
                            ? "cursor-default border-green-500/60 bg-green-500/20 text-green-500"
                            : verifying === u.id
                              ? "cursor-wait border-border/40 bg-muted/50 text-foreground/40"
                              : "border-accent bg-accent text-background hover:bg-transparent hover:text-accent"
                        }`}
                      >
                        {verifying === u.id
                          ? "Verifying..."
                          : u.wizardVerified
                            ? "✓ Verified by Coach"
                            : "Mark as Verified by Coach"}
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

