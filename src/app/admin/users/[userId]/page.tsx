"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  doc,
  getDoc,
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

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

type UserProfile = {
  height?: string;
  weight?: string;
  age?: string;
  gender?: string;
  activityLevel?: string;
  goal?: string;
  dietaryRestrictions?: string;
  allergies?: string;
  preferences?: string;
  [key: string]: string | undefined;
};

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [userData, setUserData] = useState<{
    displayName?: string | null;
    email?: string | null;
    packageTier?: string | null;
    mealPlanStatus?: string | null;
    mealPlanFileURL?: string | null;
    mealPlanImageURLs?: string[] | null;
    groceryListURL?: string | null;
    mealPlanDeliveredAt?: Date | null;
    createdAt?: Date | null;
    profile?: UserProfile | null;
  } | null>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [groceryFile, setGroceryFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (adminDoc.exists() && adminDoc.data()?.role === "admin") {
          setIsAdmin(true);
        } else {
          router.replace("/dashboard");
        }
      } catch (error) {
        console.error("Failed to verify admin role", error);
        router.replace("/dashboard");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const loadUser = async () => {
      if (!isAdmin || !userId) return;
      setLoading(true);
      try {
        const targetDoc = await getDoc(doc(db, "users", userId));
        if (!targetDoc.exists()) {
          setUserData(null);
          setFeedback("User not found.");
          return;
        }
        const data = targetDoc.data();
        const mealPlanDeliveredAt = data?.mealPlanDeliveredAt?.toDate
          ? data.mealPlanDeliveredAt.toDate()
          : data?.mealPlanDeliveredAt instanceof Date
          ? data.mealPlanDeliveredAt
          : null;
        const createdAt = data?.createdAt?.toDate
          ? data.createdAt.toDate()
          : data?.createdAt instanceof Date
          ? data.createdAt
          : null;

        setUserData({
          displayName: data?.displayName ?? null,
          email: data?.email ?? null,
          packageTier: data?.packageTier ?? null,
          mealPlanStatus: data?.mealPlanStatus ?? "Not Started",
          mealPlanFileURL: data?.mealPlanFileURL ?? null,
          mealPlanImageURLs: (data?.mealPlanImageURLs as string[] | null) ?? null,
          groceryListURL: data?.groceryListURL ?? null,
          mealPlanDeliveredAt,
          createdAt,
          profile: (data?.profile as UserProfile | null) ?? null,
        });
        setFeedback(null);
      } catch (error) {
        console.error("Failed to load user", error);
        setFeedback("Unable to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadUser();
  }, [isAdmin, userId]);

  const daysSince = useCallback((date?: Date | null) => {
    if (!date) return null;
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 0;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }, []);

  const handleSubmit = async () => {
    if (!userId || !userData) return;
    if (!pdfFile) {
      setFeedback("Meal plan PDF is required.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setFeedback(null);

    try {
      const updates: Record<string, unknown> = {
        mealPlanStatus: "Delivered",
        mealPlanDeliveredAt: serverTimestamp(),
      };

      // Upload PDF
      const pdfRef = ref(storage, `mealPlans/${userId}/plan.pdf`);
      const pdfTask = uploadBytesResumable(pdfRef, pdfFile, {
        contentType: pdfFile.type,
      });

      const pdfSnapshot: UploadTaskSnapshot = await new Promise(
        (resolve, reject) => {
          pdfTask.on(
            "state_changed",
            (snap) => {
              setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 30));
            },
            reject,
            () => resolve(pdfTask.snapshot)
          );
        }
      );
      updates.mealPlanFileURL = await getDownloadURL(pdfSnapshot.ref);

      // Upload images
      const imageUrls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        let completed = 0;
        for (const file of Array.from(imageFiles)) {
          const imageRef = ref(storage, `mealPlans/${userId}/images/${file.name}`);
          const imageTask = uploadBytesResumable(imageRef, file, {
            contentType: file.type,
          });
          await new Promise<void>((resolve, reject) => {
            imageTask.on(
              "state_changed",
              (snap) => {
                const base = 30;
                const weight = 40;
                const progressValue = base +
                  Math.round(((completed + snap.bytesTransferred / snap.totalBytes) / imageFiles.length) * weight);
                setProgress(progressValue);
              },
              reject,
              async () => {
                const downloadURL = await getDownloadURL(imageTask.snapshot.ref);
                imageUrls.push(downloadURL);
                completed += 1;
                resolve();
              }
            );
          });
        }
      }
      if (imageUrls.length > 0) {
        const existing = userData.mealPlanImageURLs ?? [];
        updates.mealPlanImageURLs = [...existing.filter(Boolean), ...imageUrls];
      }

      // Upload grocery list
      if (groceryFile) {
        const groceryRef = ref(storage, `mealPlans/${userId}/grocery-list.pdf`);
        const groceryTask = uploadBytesResumable(groceryRef, groceryFile, {
          contentType: groceryFile.type,
        });
        const grocerySnapshot: UploadTaskSnapshot = await new Promise(
          (resolve, reject) => {
            groceryTask.on(
              "state_changed",
              (snap) => {
                const base = 70;
                const weight = 30;
                const progressValue = base +
                  Math.round((snap.bytesTransferred / snap.totalBytes) * weight);
                setProgress(progressValue);
              },
              reject,
              () => resolve(groceryTask.snapshot)
            );
          }
        );
        updates.groceryListURL = await getDownloadURL(grocerySnapshot.ref);
      }

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updates);

      setFeedback("Meal plan assets uploaded successfully.");
      setPdfFile(null);
      setImageFiles(null);
      setGroceryFile(null);
      setProgress(100);

      // refresh user data
      const refreshed = await getDoc(userRef);
      if (refreshed.exists()) {
        const data = refreshed.data();
        setUserData((prev) => ({
          ...prev,
          mealPlanFileURL: data?.mealPlanFileURL ?? null,
          mealPlanImageURLs: (data?.mealPlanImageURLs as string[] | null) ?? null,
          groceryListURL: data?.groceryListURL ?? null,
          mealPlanStatus: data?.mealPlanStatus ?? "Delivered",
          mealPlanDeliveredAt: data?.mealPlanDeliveredAt?.toDate
            ? data.mealPlanDeliveredAt.toDate()
            : data?.mealPlanDeliveredAt instanceof Date
            ? data.mealPlanDeliveredAt
            : prev?.mealPlanDeliveredAt ?? null,
        }));
      }
    } catch (error) {
      console.error("Upload failed", error);
      setFeedback("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (checkingAuth || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          Loading user profile...
        </p>
      </div>
    );
  }

  if (!isAdmin || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/60">
          User profile unavailable.
        </p>
      </div>
    );
  }

  const deliveryDays = daysSince(userData.mealPlanDeliveredAt);
  const signupDays = daysSince(userData.createdAt);

  return (
    <div className="flex min-h-screen flex-col gap-8 bg-background px-6 py-10 text-foreground sm:py-14 lg:px-10">
      <motion.header
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-muted/60 px-6 py-6 shadow-[0_0_70px_-35px_rgba(215,38,61,0.6)] backdrop-blur sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="font-bold text-2xl uppercase tracking-[0.32em] text-foreground sm:text-3xl">
            {userData.displayName ?? userData.email ?? "User"}
          </h1>
          <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
            {userData.email ?? "No email on file"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
        >
          Back to Users
        </button>
      </motion.header>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/70 bg-muted/70 px-6 py-4 text-center text-xs font-medium uppercase tracking-[0.28em] text-foreground/70"
        >
          {feedback}
        </motion.div>
      )}

      <motion.section
        id="overview"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
      >
        <h2 className="font-bold text-xl uppercase tracking-[0.32em] text-foreground">
          Profile Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <OverviewItem label="Name" value={userData.displayName ?? "—"} />
          <OverviewItem label="Email" value={userData.email ?? "—"} />
          <OverviewItem
            label="Package Tier"
            value={userData.packageTier ?? "Not assigned"}
          />
          <OverviewItem
            label="Goal"
            value={userData.profile?.goal ?? "Not provided"}
          />
          <OverviewItem
            label="Meal Plan Status"
            value={userData.mealPlanStatus ?? "Not Started"}
          />
          <OverviewItem
            label="Days Since Signup"
            value={signupDays !== null ? `${signupDays} days` : "—"}
          />
          <OverviewItem
            label="Days Since Delivery"
            value={deliveryDays !== null ? `${deliveryDays} days` : "—"}
          />
        </div>

        {userData.profile && (
          <div className="mt-4">
            <h3 className="font-bold uppercase tracking-[0.3em] text-foreground">
              Macro Intake Details
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(userData.profile)
                .filter(([, value]) => value && value.trim() !== "")
                .map(([key, value]) => (
                  <OverviewItem
                    key={key}
                    label={key.replace(/([A-Z])/g, " $1").toUpperCase()}
                    value={value ?? "—"}
                  />
                ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          {userData.mealPlanFileURL && (
            <a
              href={userData.mealPlanFileURL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-accent bg-accent px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-background transition hover:bg-transparent hover:text-accent"
            >
              Download Meal Plan
            </a>
          )}
          {userData.groceryListURL && (
            <a
              href={userData.groceryListURL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent"
            >
              Download Grocery List
            </a>
          )}
        </div>
      </motion.section>

      <motion.section
        id="uploads"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
      >
        <h2 className="font-display text-xl uppercase tracking-[0.32em] text-foreground">
          Upload Meal Plan
        </h2>
        <p className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/60">
          Upload the finalized plan and supporting assets for this athlete.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <UploadField
            label="Meal Plan PDF"
            description="Required — replaces any existing plan."
            accept="application/pdf"
            onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
          />
          <UploadField
            label="Supporting Images"
            description="Optional — up to 10 images."
            accept="image/*"
            multiple
            onChange={(event) => setImageFiles(event.target.files)}
          />
          <UploadField
            label="Grocery List PDF"
            description="Optional companion grocery list."
            accept="application/pdf"
            onChange={(event) => setGroceryFile(event.target.files?.[0] ?? null)}
          />
        </div>

        {uploading && (
          <div className="rounded-2xl border border-accent/40 bg-background/20 px-4 py-3 text-[0.6rem] uppercase tracking-[0.3em] text-accent">
            Uploading… {progress}%
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading}
            className={`rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-[0.32em] transition ${
              uploading
                ? "cursor-not-allowed border-border/50 text-foreground/40"
                : "border-accent bg-accent text-background hover:bg-transparent hover:text-accent"
            }`}
          >
            Submit Updates
          </button>
        </div>
      </motion.section>
    </div>
  );
}

function OverviewItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="rounded-2xl border border-border/60 bg-background/20 px-4 py-4 text-left"
    >
      <span className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-foreground/60">
        {label}
      </span>
      <p className="mt-1 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
        {value}
      </p>
    </motion.div>
  );
}

function UploadField({
  label,
  description,
  accept,
  multiple,
  onChange,
}: {
  label: string;
  description: string;
  accept: string;
  multiple?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/20 px-4 py-4 text-left">
      <span className="text-xs uppercase tracking-[0.32em] text-foreground/70">
        {label}
      </span>
      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
        {description}
      </span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
        className="mt-2 text-[0.65rem] uppercase tracking-[0.28em] text-foreground/80 file:mr-3 file:rounded-full file:border file:border-border/70 file:bg-background/40 file:px-4 file:py-2 file:text-[0.6rem] file:uppercase file:tracking-[0.3em] file:text-foreground/70 file:transition file:hover:border-accent file:hover:text-accent"
      />
    </label>
  );
}
