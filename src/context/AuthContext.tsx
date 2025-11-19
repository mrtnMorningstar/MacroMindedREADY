"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserDoc = {
  role?: string;
  packageTier?: string | null;
  displayName?: string | null;
  email?: string | null;
  mealPlanStatus?: string | null;
  macroWizardCompleted?: boolean;
  [key: string]: any;
};

type AuthContextValue = {
  user: User | null;
  userDoc: UserDoc | null;
  loadingAuth: boolean;
  loadingUserDoc: boolean;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingUserDoc, setLoadingUserDoc] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Handle Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u && user) {
        // User was logged in but now logged out - session expired
        setSessionExpired(true);
      } else {
        setSessionExpired(false);
      }
      setUser(u);
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load Firestore user document when user is defined
  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setLoadingUserDoc(false);
      return;
    }

    setLoadingUserDoc(true);
    const loadUserDoc = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        if (userDocSnapshot.exists()) {
          setUserDoc(userDocSnapshot.data() as UserDoc);
        } else {
          setUserDoc(null);
        }
      } catch (error) {
        console.error("Failed to load user document:", error);
        setUserDoc(null);
      } finally {
        setLoadingUserDoc(false);
      }
    };

    void loadUserDoc();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loadingAuth,
        loadingUserDoc,
        sessionExpired,
        setSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

