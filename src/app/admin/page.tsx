"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db, storage } from "@/lib/firebase";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
};

type UploadState = {
  progress: number;
  status: "idle" | "uploading" | "error" | "success";
  errorMessage?: string;
};

const baseBackground = "bg-[radial-gradient(circle_at_top,#161616_0%,rgba(0,0,0,0.92)_60%,#000_98%)]";

export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    {}
  );

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

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setFeedback(null);
      const snapshot = await getDocs(collection(db, "users"));
      const records: UserRecord[] = snapshot.docs.map((docSnapshot) => {
        const data = docSnapshot.data();
        return {
          id: docSnapshot.id,
          email: data?.email ?? null,
          displayName: data?.displayName ?? null,
          packageTier: data?.packageTier ?? null,
          mealPlanStatus: data?.mealPlanStatus ?? null,
          mealPlanFileURL: data?.mealPlanFileURL ?? null,
        };
      });

      setUsers(records);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setFeedback("Unable to load user data. Please refresh the page.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleFileUpload = useCallback(
    async (userId: string, file: File) => {
      setUploadStates((prev) => ({
        ...prev,
        [userId]: { progress: 0, status: "uploading" },
      }));

      try {
        const storageRef = ref(storage, `meal-plans/${userId}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file, {
          contentType: file.type,
        });

        const snapshot: UploadTaskSnapshot = await new Promise(
          (resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snap) => {
                const progress = Math.round(
                  (snap.bytesTransferred / snap.totalBytes) * 100
                );
                setUploadStates((prev) => ({
                  ...prev,
                  [userId]: { progress, status: "uploading" },
                }));
              },
              reject,
              () => resolve(uploadTask.snapshot)
            );
          }
        );

        const downloadURL = await getDownloadURL(snapshot.ref);
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          mealPlanFileURL: downloadURL,
          mealPlanStatus: "Delivered",
        });

        setFeedback("Meal plan uploaded and status updated.");
        setUploadStates((prev) => ({
          ...prev,
          [userId]: { progress: 100, status: "success" },
        }));
        void fetchUsers();
      } catch (error) {
        console.error("Upload failed:", error);
        setUploadStates((prev) => ({
          ...prev,
          [userId]: {
            progress: 0,
            status: "error",
            errorMessage: "Upload failed. Try again.",
          },
        }));
      }
    },
    [fetchUsers]
  );

  const handleFileChange = useCallback(
    (userId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setFeedback(null);
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        setUploadStates((prev) => ({
          ...prev,
          [userId]: {
            progress: 0,
            status: "error",
            errorMessage: "Only PDF files are supported.",
          },
        }));
        return;
      }

      void handleFileUpload(userId, file);
    },
    [handleFileUpload]
  );

  const activeUploads = useMemo(() => Object.keys(uploadStates), [uploadStates]);

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

  return (
    <div className="relative isolate min-h-screen bg-background text-foreground">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1 }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute -top-36 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-accent/30 blur-3xl" />
        <div className={`absolute inset-0 ${baseBackground}`} />
      </motion.div>

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 sm:py-20">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl uppercase tracking-[0.24em] text-foreground sm:text-4xl">
              Admin Control Tower
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.32em] text-foreground/60 sm:text-sm">
              Oversee athlete progress, deliver plans, and manage operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            className="rounded-full border border-border/80 bg-muted/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-foreground transition hover:border-accent hover:bg-accent hover:text-background"
          >
            Refresh Data
          </button>
        </header>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
          >
            {feedback}
          </motion.div>
        )}

        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur">
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-accent/35 via-accent/10 to-transparent blur-3xl" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xs uppercase tracking-[0.45em] text-accent">
                Athlete Roster
              </h2>
              <p className="text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
                {loadingUsers
                  ? "Fetching user data..."
                  : `${users.length} users loaded`}
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background/20">
              <table className="min-w-full divide-y divide-border/60 text-left">
                <thead className="uppercase tracking-[0.3em] text-foreground/60 text-[0.6rem]">
                  <tr className="text-foreground/60">
                    <th className="px-5 py-4 font-medium">Name</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Package</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Meal Plan</th>
                    <th className="px-5 py-4 font-medium">Upload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-[0.7rem] uppercase tracking-[0.24em] text-foreground/80">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-6 text-center">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((userRecord) => {
                      const uploadState = uploadStates[userRecord.id];
                      return (
                        <tr key={userRecord.id}>
                          <td className="px-5 py-4">
                            {userRecord.displayName ?? "—"}
                          </td>
                          <td className="px-5 py-4">{userRecord.email ?? "—"}</td>
                          <td className="px-5 py-4">
                            {userRecord.packageTier ?? "—"}
                          </td>
                          <td className="px-5 py-4">
                            {userRecord.mealPlanStatus ?? "Not Started"}
                          </td>
                          <td className="px-5 py-4">
                            {userRecord.mealPlanFileURL ? (
                              <a
                                href={userRecord.mealPlanFileURL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent underline"
                              >
                                View File
                              </a>
                            ) : (
                              <span className="text-foreground/40">Pending</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-2">
                              <label className="rounded-full border border-border/70 bg-background/20 px-4 py-2 text-center text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent">
                                Upload PDF
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  className="hidden"
                                  onChange={handleFileChange(userRecord.id)}
                                  disabled={
                                    uploadState?.status === "uploading"
                                  }
                                />
                              </label>
                              {uploadState && (
                                <div className="text-[0.55rem] uppercase tracking-[0.28em] text-foreground/50">
                                  {uploadState.status === "uploading" && (
                                    <span>Uploading {uploadState.progress}%</span>
                                  )}
                                  {uploadState.status === "success" && (
                                    <span className="text-accent">Uploaded</span>
                                  )}
                                  {uploadState.status === "error" && (
                                    <span className="text-accent">
                                      {uploadState.errorMessage ??
                                        "Upload failed"}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

