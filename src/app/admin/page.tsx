"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db, storage } from "@/lib/firebase";

type UserProfile = Record<string, string | null | undefined>;

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  profile?: UserProfile | null;
  mealPlanDeliveredAt?: unknown;
  groceryListURL?: string | null;
};

type UploadStatus = {
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pdfUploadStates, setPdfUploadStates] = useState<
    Record<string, UploadStatus>
  >({});
  const [imageUploadStates, setImageUploadStates] = useState<
    Record<string, UploadStatus>
  >({});
  const [groceryUploadStates, setGroceryUploadStates] = useState<
    Record<string, UploadStatus>
  >({});
  const [groceryUploadStates, setGroceryUploadStates] = useState<
    Record<string, UploadStatus>
  >({});

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
          mealPlanImageURLs: (data?.mealPlanImageURLs as string[] | null) ?? null,
          profile: (data?.profile as UserProfile | null) ?? null,
          mealPlanDeliveredAt: data?.mealPlanDeliveredAt ?? null,
          groceryListURL: data?.groceryListURL ?? null,
        };
      });

      setUsers(records);
      setSelectedUserId((prev) => {
        if (prev && records.some((record) => record.id === prev)) {
          return prev;
        }
        return records[0]?.id ?? null;
      });
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

  const uploadPdfForUser = useCallback(
    async (user: UserRecord, file: File) => {
      setPdfUploadStates((prev) => ({
        ...prev,
        [user.id]: { status: "uploading", progress: 0 },
      }));

      try {
        const pdfRef = ref(storage, `mealPlans/${user.id}/plan.pdf`);
        const uploadTask = uploadBytesResumable(pdfRef, file, {
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
                setPdfUploadStates((prev) => ({
                  ...prev,
                  [user.id]: { status: "uploading", progress },
                }));
              },
              reject,
              () => resolve(uploadTask.snapshot)
            );
          }
        );

        const downloadURL = await getDownloadURL(snapshot.ref);
        const userRef = doc(db, "users", user.id);

        const updatePayload: Record<string, unknown> = {
          mealPlanFileURL: downloadURL,
          mealPlanStatus: "Delivered",
        };
        if (!user.mealPlanDeliveredAt) {
          updatePayload.mealPlanDeliveredAt = serverTimestamp();
        }

        await updateDoc(userRef, updatePayload);

        setPdfUploadStates((prev) => ({
          ...prev,
          [user.id]: { status: "success", progress: 100 },
        }));
        setFeedback("Meal plan PDF uploaded.");
        await fetchUsers();
      } catch (error) {
        console.error("PDF upload failed:", error);
        setPdfUploadStates((prev) => ({
          ...prev,
          [user.id]: {
            status: "error",
            progress: 0,
            errorMessage: "PDF upload failed. Try again.",
          },
        }));
      }
    },
    [fetchUsers]
  );

  const uploadImagesForUser = useCallback(
    async (user: UserRecord, files: FileList) => {
      const filtered = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (filtered.length === 0) {
        setImageUploadStates((prev) => ({
          ...prev,
          [user.id]: {
            status: "error",
            progress: 0,
            errorMessage: "Please select image files.",
          },
        }));
        return;
      }

      if (filtered.length > 10) {
        setImageUploadStates((prev) => ({
          ...prev,
          [user.id]: {
            status: "error",
            progress: 0,
            errorMessage: "Upload up to 10 images at a time.",
          },
        }));
        return;
      }

      setImageUploadStates((prev) => ({
        ...prev,
        [user.id]: { status: "uploading", progress: 0 },
      }));

      try {
        const urls: string[] = [];
        const total = filtered.length;
        let completed = 0;

        for (const file of filtered) {
          const imageRef = ref(
            storage,
            `mealPlans/${user.id}/images/${file.name}`
          );
          const uploadTask = uploadBytesResumable(imageRef, file, {
            contentType: file.type,
          });

          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snap) => {
                const progress = Math.round(
                  ((completed + snap.bytesTransferred / snap.totalBytes) /
                    total) *
                    100
                );
                setImageUploadStates((prev) => ({
                  ...prev,
                  [user.id]: { status: "uploading", progress },
                }));
              },
              reject,
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                urls.push(downloadURL);
                completed += 1;
                const progress = Math.round((completed / total) * 100);
                setImageUploadStates((prev) => ({
                  ...prev,
                  [user.id]: { status: "uploading", progress },
                }));
                resolve();
              }
            );
          });
        }

        const existingImages = user.mealPlanImageURLs ?? [];
        const updatedImages = [...existingImages.filter(Boolean), ...urls];
        const userRef = doc(db, "users", user.id);
        const updatePayload: Record<string, unknown> = {
          mealPlanImageURLs: updatedImages,
          mealPlanStatus: "Delivered",
        };
        if (!user.mealPlanDeliveredAt) {
          updatePayload.mealPlanDeliveredAt = serverTimestamp();
        }
        await updateDoc(userRef, updatePayload);

        setImageUploadStates((prev) => ({
          ...prev,
          [user.id]: { status: "success", progress: 100 },
        }));
        setFeedback("Supporting images uploaded.");
        await fetchUsers();
      } catch (error) {
        console.error("Image upload failed:", error);
        setImageUploadStates((prev) => ({
          ...prev,
          [user.id]: {
            status: "error",
            progress: 0,
            errorMessage: "Image upload failed. Try again.",
          },
        }));
      }
    },
    [fetchUsers]
  );

  const handlePdfInputChange = useCallback(
    (user: UserRecord) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setFeedback(null);
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (file.type !== "application/pdf") {
          setPdfUploadStates((prev) => ({
            ...prev,
            [user.id]: {
              status: "error",
              progress: 0,
              errorMessage: "Only PDF files are supported.",
            },
          }));
          return;
        }
        void uploadPdfForUser(user, file);
      },
    [uploadPdfForUser]
  );

  const handleImagesInputChange = useCallback(
    (user: UserRecord) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setFeedback(null);
        const files = event.target.files;
        event.target.value = "";
        if (!files || files.length === 0) return;
        void uploadImagesForUser(user, files);
      },
    [uploadImagesForUser]
  );

  const uploadGroceryListForUser = useCallback(
    async (user: UserRecord, file: File) => {
      setGroceryUploadStates((prev) => ({
        ...prev,
        [user.id]: { status: "uploading", progress: 0 },
      }));

      try {
        const groceryRef = ref(storage, `mealPlans/${user.id}/grocery-list.pdf`);
        const uploadTask = uploadBytesResumable(groceryRef, file, {
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
                setGroceryUploadStates((prev) => ({
                  ...prev,
                  [user.id]: { status: "uploading", progress },
                }));
              },
              reject,
              () => resolve(uploadTask.snapshot)
            );
          }
        );

        const downloadURL = await getDownloadURL(snapshot.ref);
        const userRef = doc(db, "users", user.id);
        const updatePayload: Record<string, unknown> = {
          groceryListURL: downloadURL,
          mealPlanStatus: "Delivered",
        };
        if (!user.mealPlanDeliveredAt) {
          updatePayload.mealPlanDeliveredAt = serverTimestamp();
        }

        await updateDoc(userRef, updatePayload);

        setGroceryUploadStates((prev) => ({
          ...prev,
          [user.id]: { status: "success", progress: 100 },
        }));
        setFeedback("Grocery list uploaded.");
        await fetchUsers();
      } catch (error) {
        console.error("Grocery list upload failed:", error);
        setGroceryUploadStates((prev) => ({
          ...prev,
          [user.id]: {
            status: "error",
            progress: 0,
            errorMessage: "Grocery list upload failed. Try again.",
          },
        }));
      }
    },
    [fetchUsers]
  );

  const handleGroceryInputChange = useCallback(
    (user: UserRecord) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        setFeedback(null);
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (file.type !== "application/pdf") {
          setGroceryUploadStates((prev) => ({
            ...prev,
            [user.id]: {
              status: "error",
              progress: 0,
              errorMessage: "Only PDF files are supported.",
            },
          }));
          return;
        }
        void uploadGroceryListForUser(user, file);
      },
    [uploadGroceryListForUser]
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
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
                    <th className="px-5 py-4 font-medium">Actions</th>
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
                      return (
                        <tr
                          key={userRecord.id}
                          className={
                            selectedUserId === userRecord.id
                              ? "bg-background/30"
                              : undefined
                          }
                        >
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
                            <button
                              type="button"
                              onClick={() => setSelectedUserId(userRecord.id)}
                              className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
                            >
                              Manage
                            </button>
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

        {selectedUser && (
          <UserDetailPanel
            user={selectedUser}
            onPdfInputChange={handlePdfInputChange(selectedUser)}
            onImagesInputChange={handleImagesInputChange(selectedUser)}
            pdfStatus={pdfUploadStates[selectedUser.id]}
            imageStatus={imageUploadStates[selectedUser.id]}
            onGroceryInputChange={handleGroceryInputChange(selectedUser)}
            groceryStatus={groceryUploadStates[selectedUser.id]}
          />
        )}
      </section>
    </div>
  );
}

type UserDetailPanelProps = {
  user: UserRecord;
  onPdfInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImagesInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGroceryInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  pdfStatus?: UploadStatus;
  imageStatus?: UploadStatus;
  groceryStatus?: UploadStatus;
};

function UserDetailPanel({
  user,
  onPdfInputChange,
  onImagesInputChange,
  onGroceryInputChange,
  pdfStatus,
  imageStatus,
  groceryStatus,
}: UserDetailPanelProps) {
  const profileEntries = useMemo(() => {
    if (!user.profile) return [];
    return Object.entries(user.profile).filter(
      ([, value]) => value && String(value).trim() !== ""
    );
  }, [user.profile]);

  const mealPlanImages = user.mealPlanImageURLs ?? [];

  const renderStatus = (status?: UploadStatus) => {
    if (!status) return null;
    if (status.status === "uploading") {
      return `Uploading ${status.progress}%`;
    }
    if (status.status === "success") {
      return "Upload complete";
    }
    if (status.status === "error") {
      return status.errorMessage ?? "Upload failed";
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-muted/60 px-6 py-10 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-accent/35 via-accent/10 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h3 className="font-display text-xs uppercase tracking-[0.45em] text-accent">
              {user.displayName ?? user.email ?? "Selected User"}
            </h3>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/60">
              {user.email ?? "No email"} · Tier:{" "}
              {user.packageTier ?? "Not assigned"}
            </p>
          </div>
          <div className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70">
            Status: {user.mealPlanStatus ?? "Not Started"}
          </div>
        </header>

        {profileEntries.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profileEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/20 px-4 py-4 text-left text-[0.65rem] uppercase tracking-[0.28em] text-foreground/70"
              >
                <span className="text-foreground/50">
                  {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                </span>
                <span className="text-xs tracking-[0.2em] text-foreground">
                  {String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/20 px-5 py-6 text-left">
            <h4 className="font-display text-xs uppercase tracking-[0.4em] text-accent">
              Upload Meal Plan PDF
            </h4>
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60">
              Upload the final PDF delivered to the client. This replaces any
              existing plan file.
            </p>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent">
              Select PDF
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onPdfInputChange}
              />
            </label>
            {pdfStatus && (
              <span className="text-[0.6rem] uppercase tracking-[0.28em] text-foreground/50">
                {renderStatus(pdfStatus)}
              </span>
            )}
            {user.mealPlanFileURL && (
              <a
                href={user.mealPlanFileURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.65rem] uppercase tracking-[0.3em] text-accent underline"
              >
                View current plan PDF
              </a>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/20 px-5 py-6 text-left">
            <h4 className="font-display text-xs uppercase tracking-[0.4em] text-accent">
              Upload Supporting Images
            </h4>
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60">
              Optional gallery for meal photos, macro breakdowns, or coaching
              notes. Up to 10 images per upload.
            </p>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent">
              Select Images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onImagesInputChange}
              />
            </label>
            {imageStatus && (
              <span className="text-[0.6rem] uppercase tracking-[0.28em] text-foreground/50">
                {renderStatus(imageStatus)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/20 px-5 py-6 text-left">
            <h4 className="font-display text-xs uppercase tracking-[0.4em] text-accent">
              Upload Grocery List PDF
            </h4>
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-foreground/60">
              Optional companion grocery list to accompany the meal plan.
            </p>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent">
              Select PDF
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={onGroceryInputChange}
              />
            </label>
            {groceryStatus && (
              <span className="text-[0.6rem] uppercase tracking-[0.28em] text-foreground/50">
                {renderStatus(groceryStatus)}
              </span>
            )}
            {user.groceryListURL && (
              <a
                href={user.groceryListURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.65rem] uppercase tracking-[0.3em] text-accent underline"
              >
                View current grocery list
              </a>
            )}
          </div>
        </div>

        {mealPlanImages.length > 0 && (
          <div className="flex flex-col gap-4">
            <h4 className="font-display text-xs uppercase tracking-[0.4em] text-accent">
              Meal Plan Gallery
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mealPlanImages.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-border/70"
                >
                  <img
                    src={url}
                    alt="Meal plan supporting"
                    className="h-32 w-full object-cover transition group-hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

