"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, updateDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";

import { auth, db, storage } from "@/lib/firebase";

type UserRecord = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  packageTier?: string | null;
  mealPlanStatus?: string | null;
  mealPlanFileURL?: string | null;
  mealPlanImageURLs?: string[] | null;
  profile?: Record<string, string | null> | null;
  groceryListURL?: string | null;
  referralCode?: string | null;
  referralCredits?: number | null;
  referredBy?: string | null;
};

type UploadStatus = {
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  errorMessage?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [uploadStates, setUploadStates] = useState<Record<string, Record<string, UploadStatus>>>({});

  // Verify admin using Firebase custom claims
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        setCheckingAuth(false);
        return;
      }
      try {
        const idTokenResult = await currentUser.getIdTokenResult();
        if (!idTokenResult.claims.admin) {
          router.replace("/dashboard");
          setCheckingAuth(false);
          return;
        }
        setIsAdmin(true);
      } catch (error) {
        console.error("Admin verification failed:", error);
        router.replace("/dashboard");
      } finally {
        setCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Subscribe to users collection (exclude admins)
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const records: UserRecord[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();
            if (data?.role === "admin") return null;
            return { id: docSnapshot.id, ...data } as UserRecord;
          })
          .filter((r): r is UserRecord => r !== null);

        setUsers(records);
        setSelectedUserId((prev) => (prev && records.some((u) => u.id === prev) ? prev : records[0]?.id ?? null));
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Failed to load users:", error);
        setFeedback("Error fetching users. Refresh page.");
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Generic upload handler
  const uploadFileForUser = useCallback(
    async (user: UserRecord, file: File, type: "mealPlan" | "images" | "grocery") => {
      const key = type === "images" ? file.name : type;
      setUploadStates((prev) => ({
        ...prev,
        [user.id]: { ...prev[user.id], [key]: { status: "uploading", progress: 0 } },
      }));

      try {
        const path =
          type === "mealPlan"
            ? `mealPlans/${user.id}/plan.pdf`
            : type === "images"
            ? `mealPlans/${user.id}/images/${file.name}`
            : `mealPlans/${user.id}/grocery-list.pdf`;

        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadStates((prev) => ({
                ...prev,
                [user.id]: { ...prev[user.id], [key]: { status: "uploading", progress } },
              }));
            },
            reject,
            resolve
          );
        });

        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        const updateData: DocumentData = {};
        if (type === "mealPlan") updateData.mealPlanFileURL = downloadURL;
        else if (type === "images") {
          updateData.mealPlanImageURLs = [...(user.mealPlanImageURLs ?? []), downloadURL];
        } else updateData.groceryListURL = downloadURL;

        updateData.mealPlanStatus = "Delivered";
        if (!user.mealPlanFileURL && type === "mealPlan") updateData.mealPlanDeliveredAt = serverTimestamp();

        await updateDoc(doc(db, "users", user.id), updateData);

        setUploadStates((prev) => ({
          ...prev,
          [user.id]: { ...prev[user.id], [key]: { status: "success", progress: 100 } },
        }));
        setFeedback(`${type} uploaded successfully.`);
      } catch (err) {
        console.error(`${type} upload failed`, err);
        setUploadStates((prev) => ({
          ...prev,
          [user.id]: { ...prev[user.id], [key]: { status: "error", progress: 0, errorMessage: "Upload failed" } },
        }));
      }
    },
    []
  );

  // Delete file handler
  const deleteFileForUser = useCallback(async (user: UserRecord, url: string, type: "mealPlan" | "images" | "grocery") => {
    if (!confirm("Are you sure you want to delete?")) return;
    try {
      const refPath = type === "images" ? url.split("/o/")[1].split("?")[0] : type === "mealPlan" ? `mealPlans/${user.id}/plan.pdf` : `mealPlans/${user.id}/grocery-list.pdf`;
      await deleteObject(ref(storage, decodeURIComponent(refPath)));
      const updateData: DocumentData = {};
      if (type === "mealPlan") updateData.mealPlanFileURL = null;
      else if (type === "images") updateData.mealPlanImageURLs = (user.mealPlanImageURLs ?? []).filter((u) => u !== url);
      else updateData.groceryListURL = null;

      await updateDoc(doc(db, "users", user.id), updateData);
      setFeedback(`${type} deleted.`);
    } catch (err) {
      console.error("Deletion failed:", err);
      setFeedback("Deletion failed.");
    }
  }, []);

  const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId) ?? null, [users, selectedUserId]);

  if (checkingAuth) return <div className="flex min-h-screen items-center justify-center">Checking admin access...</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <motion.aside className="hidden lg:flex flex-col w-64 p-6 bg-muted/40 border-r border-border/70">
        <span className="font-bold uppercase">MacroMinded</span>
        <nav className="mt-10 flex flex-col gap-3">
          <Link href="/admin" className={`rounded-full border px-4 py-2 ${pathname === "/admin" ? "bg-accent/20" : ""}`}>Users</Link>
          <Link href="/admin/referrals" className={`rounded-full border px-4 py-2 ${pathname === "/admin/referrals" ? "bg-accent/20" : ""}`}>Referrals</Link>
          <Link href="/admin/recipes" className={`rounded-full border px-4 py-2 ${pathname === "/admin/recipes" ? "bg-accent/20" : ""}`}>Recipes</Link>
          <Link href="/admin/sales" className={`rounded-full border px-4 py-2 ${pathname === "/admin/sales" ? "bg-accent/20" : ""}`}>Sales</Link>
          <Link href="/admin/requests" className={`rounded-full border px-4 py-2 ${pathname === "/admin/requests" ? "bg-accent/20" : ""}`}>Plan Requests</Link>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 p-10 lg:ml-64">
        <header className="flex justify-between items-center mb-8">
          <h1 className="font-bold text-2xl">MacroMinded Admin</h1>
          <button onClick={() => auth.signOut().then(() => router.replace("/login"))} className="px-4 py-2 border rounded-full bg-accent text-background">Logout</button>
        </header>

        {feedback && <div className="mb-4 text-accent">{feedback}</div>}

        {/* Users Table */}
        <section>
          <h2 className="font-bold uppercase mb-4">Users</h2>
          <div className="overflow-x-auto rounded-xl border bg-muted/60">
            <table className="min-w-full divide-y divide-border/60">
              <thead className="text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th>Name</th><th>Email</th><th>Package</th><th>Status</th><th>Meal Plan</th><th>Referrals</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? <tr><td colSpan={7}>Loading...</td></tr> :
                  users.map((user) => (
                    <tr key={user.id} className={selectedUserId === user.id ? "bg-background/20" : ""}>
                      <td>{user.displayName ?? "—"}</td>
                      <td>{user.email ?? "—"}</td>
                      <td>{user.packageTier ?? "—"}</td>
                      <td>{user.mealPlanStatus ?? "Not Started"}</td>
                      <td>{user.mealPlanFileURL ? <a href={user.mealPlanFileURL} target="_blank" className="text-accent underline">View</a> : "Pending"}</td>
                      <td>{user.referralCredits ?? 0}</td>
                      <td><button onClick={() => setSelectedUserId(user.id)}>Manage</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </section>

        {selectedUser && (
          <UserDetailPanel
            user={selectedUser}
            uploadFile={uploadFileForUser}
            deleteFile={deleteFileForUser}
            uploadStates={uploadStates[selectedUser.id] ?? {}}
          />
        )}
      </div>
    </div>
  );
}

type UserDetailPanelProps = {
  user: UserRecord;
  uploadFile: (user: UserRecord, file: File, type: "mealPlan" | "images" | "grocery") => void;
  deleteFile: (user: UserRecord, url: string, type: "mealPlan" | "images" | "grocery") => void;
  uploadStates: Record<string, UploadStatus>;
};

function UserDetailPanel({ user, uploadFile, deleteFile, uploadStates }: UserDetailPanelProps) {
  const handleInputChange = (type: "mealPlan" | "images" | "grocery") => (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => uploadFile(user, file, type));
    event.target.value = "";
  };

  const profileEntries = useMemo(() => Object.entries(user.profile ?? {}), [user.profile]);

  return (
    <section className="mt-8 p-6 border rounded-xl bg-muted/50">
      <h3 className="font-bold mb-4">{user.displayName ?? user.email}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {profileEntries.map(([key, value]) => (
          <div key={key} className="p-2 border rounded">{key}: {value}</div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <UploadCard type="mealPlan" label="Meal Plan PDF" currentUrl={user.mealPlanFileURL ?? null} uploadStates={uploadStates} handleChange={handleInputChange} handleDelete={deleteFile} />
        <UploadCard type="images" label="Images" currentUrl={null} uploadStates={uploadStates} handleChange={handleInputChange} handleDelete={deleteFile} />
        <UploadCard type="grocery" label="Grocery List" currentUrl={user.groceryListURL ?? null} uploadStates={uploadStates} handleChange={handleInputChange} handleDelete={deleteFile} />
      </div>
    </section>
  );
}

type UploadCardProps = {
  type: "mealPlan" | "images" | "grocery";
  label: string;
  currentUrl: string | null;
  uploadStates: Record<string, UploadStatus>;
  handleChange: (type: "mealPlan" | "images" | "grocery") => (e: ChangeEvent<HTMLInputElement>) => void;
  handleDelete: (user: UserRecord, url: string, type: "mealPlan" | "images" | "grocery") => void;
};

function UploadCard({ type, label, currentUrl, uploadStates, handleChange, handleDelete }: UploadCardProps) {
  const status = uploadStates[type];
  return (
    <div className="p-4 border rounded flex flex-col gap-2">
      <h4>{label}</h4>
      <input type="file" onChange={handleChange(type)} multiple={type === "images"} />
      {status && <span>{status.status === "uploading" ? `Uploading ${status.progress}%` : status.status === "success" ? "Uploaded" : status.errorMessage}</span>}
      {currentUrl && <div><a href={currentUrl} target="_blank">View</a>{type !== "images" && <button onClick={() => handleDelete({} as any, currentUrl, type)}>Delete</button>}</div>}
    </div>
  );
}
