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
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  type QuerySnapshot,
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  deleteObject,
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
  const [imageUploadStates, setImageUploadStates] =
    useState<Record<string, UploadStatus>>({});
  const [groceryUploadStates, setGroceryUploadStates] =
    useState<Record<string, UploadStatus>>({});
  const [activeSection, setActiveSection] = useState("users");

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

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
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
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Failed to subscribe to users:", error);
        setFeedback("Unable to load user data. Please refresh the page.");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

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

        await new Promise<void>((resolve, reject) => {
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
            resolve
          );
        });

        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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
    [setFeedback]
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

        for (let index = 0; index < filtered.length; index += 1) {
          const file = filtered[index];
          const imageRef = ref(storage, `mealPlans/${user.id}/images/${file.name}`);
          const uploadTask = uploadBytesResumable(imageRef, file, {
            contentType: file.type,
          });

          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snap) => {
                const progress = Math.round(
                  ((index + snap.bytesTransferred / snap.totalBytes) / total) * 100
                );
                setImageUploadStates((prev) => ({
                  ...prev,
                  [user.id]: { status: "uploading", progress },
                }));
              },
              reject,
              () => resolve()
            );
          });

          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          urls.push(downloadURL);
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
    [setFeedback]
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

        await new Promise<void>((resolve, reject) => {
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
            resolve
          );
        });

        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
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
    [setFeedback]
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

  const deleteMealPlanFile = useCallback(
    async (user: UserRecord) => {
      if (!user.mealPlanFileURL) return;
      if (!confirm("Are you sure you want to delete the meal plan PDF?")) return;

      try {
        const pdfRef = ref(storage, `mealPlans/${user.id}/plan.pdf`);
        await deleteObject(pdfRef);
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          mealPlanFileURL: null,
        });
        setFeedback("Meal plan PDF deleted.");
      } catch (error) {
        console.error("Failed to delete meal plan PDF", error);
        setFeedback("Failed to delete meal plan PDF.");
      }
    },
    []
  );

  const deleteGroceryList = useCallback(
    async (user: UserRecord) => {
      if (!user.groceryListURL) return;
      if (!confirm("Are you sure you want to delete the grocery list?")) return;

      try {
        const groceryRef = ref(storage, `mealPlans/${user.id}/grocery-list.pdf`);
        await deleteObject(groceryRef);
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          groceryListURL: null,
        });
        setFeedback("Grocery list deleted.");
      } catch (error) {
        console.error("Failed to delete grocery list", error);
        setFeedback("Failed to delete grocery list.");
      }
    },
    []
  );

  const deleteImage = useCallback(
    async (user: UserRecord, imageUrl: string) => {
      if (!confirm("Are you sure you want to delete this image?")) return;

      try {
        const urlObj = new URL(imageUrl);
        const pathMatch = urlObj.pathname.match(/mealPlans%2F([^%]+)%2Fimages%2F(.+)/);
        if (!pathMatch) {
          const altMatch = urlObj.pathname.match(/mealPlans\/([^/]+)\/images\/(.+)/);
          if (altMatch) {
            const [, userIdFromPath, fileName] = altMatch;
            const imageRef = ref(storage, `mealPlans/${userIdFromPath}/images/${decodeURIComponent(fileName)}`);
            await deleteObject(imageRef);
          } else {
            throw new Error("Could not extract file path from URL");
          }
        } else {
          const [, userIdFromPath, fileName] = pathMatch;
          const imageRef = ref(storage, `mealPlans/${userIdFromPath}/images/${decodeURIComponent(fileName)}`);
          await deleteObject(imageRef);
        }

        const userRef = doc(db, "users", user.id);
        const currentImages = user.mealPlanImageURLs ?? [];
        const updatedImages = currentImages.filter((url) => url !== imageUrl);
        await updateDoc(userRef, {
          mealPlanImageURLs: updatedImages,
        });
        setFeedback("Image deleted.");
      } catch (error) {
        console.error("Failed to delete image", error);
        setFeedback("Failed to delete image.");
      }
    },
    []
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

  const navItems: Array<{ id: typeof activeSection; label: string }> = [
    { id: "users", label: "Users" },
    { id: "sales", label: "Sales / Revenue" },
    { id: "requests", label: "Plan Requests" },
  ];

  const planRequestUsers = users.filter(
    (user) =>
      user.packageTier &&
      (user.mealPlanStatus ?? "Not Started") !== "Delivered"
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden h-[calc(100vh-5rem)] w-64 flex-col border-r border-border/70 bg-muted/40 px-6 py-10 shadow-[0_0_80px_-40px_rgba(215,38,61,0.6)] backdrop-blur lg:fixed lg:left-0 lg:top-20 lg:flex"
      >
        <span className="font-bold uppercase tracking-[0.48em] text-foreground">
          MacroMinded
        </span>
        <p className="mt-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
          Admin navigation
        </p>

        <nav className="mt-10 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`rounded-full border px-4 py-2 text-left text-[0.65rem] uppercase tracking-[0.3em] transition ${
                  activeSection === item.id
                    ? "border-border/60 text-foreground"
                    : "border-border/70 text-foreground/70 hover:border-accent hover:text-accent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </motion.aside>

      <div className="relative isolate flex-1 lg:ml-64">
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
                MacroMinded Admin
              </h1>
              <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                Control tower for athletes, sales, and fulfillment.
              </p>
            </div>
            <div className="flex gap-3">
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

          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-accent/40 bg-muted/70 px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.28em] text-accent"
            >
              {feedback}
            </motion.div>
          )}

          <section id="users" className="flex flex-col gap-8">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-bold text-xl uppercase tracking-[0.32em] text-foreground">
                Users
              </h2>
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
                {loadingUsers
                  ? "Fetching user data..."
                  : `${users.length} users loaded`}
              </p>
            </header>

            <div className="overflow-hidden rounded-3xl border border-border/80 bg-muted/60 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur">
              <div className="overflow-x-auto">
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
                      users.map((userRecord) => (
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedUser && (
              <UserDetailPanel
                user={selectedUser}
                onPdfInputChange={handlePdfInputChange(selectedUser)}
                onImagesInputChange={handleImagesInputChange(selectedUser)}
                onGroceryInputChange={handleGroceryInputChange(selectedUser)}
                pdfStatus={pdfUploadStates[selectedUser.id]}
                imageStatus={imageUploadStates[selectedUser.id]}
                groceryStatus={groceryUploadStates[selectedUser.id]}
                onDeleteMealPlan={() => deleteMealPlanFile(selectedUser)}
                onDeleteGroceryList={() => deleteGroceryList(selectedUser)}
                onDeleteImage={(imageUrl) => deleteImage(selectedUser, imageUrl)}
              />
            )}
          </section>

          <section
            id="sales"
            className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
          >
            <h2 className="font-display text-xl uppercase tracking-[0.32em] text-foreground">
              Sales / Revenue
            </h2>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/60">
              Stripe analytics coming soon. Monitor topline performance here.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total Sales", value: "$0", hint: "Live data planned" },
                { label: "Active Subscriptions", value: "0", hint: "Stripe sync" },
                { label: "MRR", value: "$0", hint: "Monthly recurring revenue" },
                { label: "Refund Requests", value: "0", hint: "Support queue" },
              ].map(({ label, value, hint }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-background/20 px-5 py-5"
                >
                  <p className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/60">
                    {label}
                  </p>
                  <p className="mt-2 text-xl font-semibold uppercase tracking-[0.24em] text-foreground">
                    {value}
                  </p>
                  <p className="mt-1 text-[0.6rem] uppercase tracking-[0.3em] text-foreground/40">
                    {hint}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section
            id="requests"
            className="flex flex-col gap-4 rounded-3xl border border-border/80 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
          >
            <h2 className="font-display text-xl uppercase tracking-[0.32em] text-foreground">
              Plan Requests
            </h2>
            <p className="text-[0.7rem] uppercase tracking-[0.3em] text-foreground/60">
              Athletes awaiting initial plans or updates.
            </p>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <table className="min-w-full divide-y divide-border/70 text-left text-[0.7rem] uppercase tracking-[0.26em] text-foreground/70">
                <thead className="bg-background/40 text-foreground/50">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Package</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {planRequestUsers.map((pendingUser) => (
                    <tr
                      key={pendingUser.id}
                      className="border-t border-border/60 text-foreground/80"
                    >
                      <td className="px-4 py-3">
                        {pendingUser.displayName ?? pendingUser.email ?? "User"}
                      </td>
                      <td className="px-4 py-3">
                        {pendingUser.packageTier ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {pendingUser.mealPlanStatus ?? "Not Started"}
                      </td>
                      <td className="px-4 py-3 text-foreground/40">
                        Auto-tracked soon
                      </td>
                    </tr>
                  ))}
                  {planRequestUsers.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-foreground/40"
                      >
                        No pending requests right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
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
  onDeleteMealPlan: () => void;
  onDeleteGroceryList: () => void;
  onDeleteImage: (imageUrl: string) => void;
};

function UserDetailPanel({
  user,
  onPdfInputChange,
  onImagesInputChange,
  onGroceryInputChange,
  pdfStatus,
  imageStatus,
  groceryStatus,
  onDeleteMealPlan,
  onDeleteGroceryList,
  onDeleteImage,
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/60 px-6 py-8 shadow-[0_0_90px_-45px_rgba(215,38,61,0.6)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-background/20 via-background/5 to-transparent blur-3xl" />
      <div className="relative flex flex-col gap-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <h3 className="font-bold uppercase tracking-[0.32em] text-foreground">
              {user.displayName ?? user.email ?? "Selected User"}
            </h3>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
              {user.email ?? "No email"} · Tier: {user.packageTier ?? "Not assigned"}
            </p>
          </div>
          <div className="rounded-full border border-border/70 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70">
            Status: {user.mealPlanStatus ?? "Not Started"}
          </div>
        </header>

        {profileEntries.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profileEntries.map(([key, value]) => (
              <motion.div
                key={key}
                whileHover={{ scale: 1.02 }}
                className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/20 px-4 py-4 text-left text-[0.65rem] font-medium uppercase tracking-[0.28em] text-foreground/70"
              >
                <span className="text-foreground/50">
                  {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                </span>
                <span className="text-xs font-bold tracking-[0.2em] text-foreground">
                  {String(value)}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <CardUpload
            title="Upload Meal Plan PDF"
            description="Required — replaces existing file."
            onChange={onPdfInputChange}
            accept="application/pdf"
            status={renderStatus(pdfStatus)}
            currentUrl={user.mealPlanFileURL}
            ctaLabel="Select PDF"
            onDelete={user.mealPlanFileURL ? onDeleteMealPlan : undefined}
          />
          <CardUpload
            title="Upload Supporting Images"
            description="Optional — upload lifestyle shots or plan breakdown visuals."
            onChange={onImagesInputChange}
            accept="image/*"
            multiple
            status={renderStatus(imageStatus)}
            ctaLabel="Select Images"
          />
          <CardUpload
            title="Upload Grocery List"
            description="Optional grocery list PDF for the client."
            onChange={onGroceryInputChange}
            accept="application/pdf"
            status={renderStatus(groceryStatus)}
            currentUrl={user.groceryListURL}
            ctaLabel="Select PDF"
            onDelete={user.groceryListURL ? onDeleteGroceryList : undefined}
          />
        </div>

        {mealPlanImages.length > 0 && (
          <div className="flex flex-col gap-4">
            <h4 className="font-bold uppercase tracking-[0.32em] text-foreground">
              Meal Plan Gallery
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {mealPlanImages.map((url) => (
                <motion.div
                  key={url}
                  whileHover={{ scale: 1.02 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/70"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={url}
                      alt="Meal plan supporting"
                      className="h-32 w-full object-cover transition group-hover:scale-105"
                    />
                  </a>
                  <button
                    type="button"
                    onClick={() => onDeleteImage(url)}
                    className="absolute right-2 top-2 rounded-full border border-red-500/70 bg-red-500/20 px-2 py-1 text-xs font-bold uppercase tracking-[0.2em] text-red-500/70 transition hover:border-red-500 hover:bg-red-500/40 hover:text-red-500"
                    title="Delete image"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CardUpload({
  title,
  description,
  accept,
  onChange,
  multiple,
  status,
  currentUrl,
  ctaLabel,
  onDelete,
}: {
  title: string;
  description: string;
  accept: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  status?: string | null;
  currentUrl?: string | null;
  ctaLabel: string;
  onDelete?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/20 px-5 py-5 text-left"
    >
      <h4 className="font-bold uppercase tracking-[0.32em] text-foreground">
        {title}
      </h4>
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-foreground/60">
        {description}
      </p>
      <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-border/70 px-4 py-2 text-[0.6rem] font-medium uppercase tracking-[0.3em] text-foreground/70 transition hover:border-accent hover:text-accent">
        {ctaLabel}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className="hidden"
        />
      </label>
      {status && (
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.28em] text-foreground/60">
          {status}
        </span>
      )}
      {currentUrl && (
        <div className="flex items-center gap-2">
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-accent underline"
          >
            View current file
          </a>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-full border border-red-500/70 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-red-500/70 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-500"
              title="Delete file"
            >
              ×
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

