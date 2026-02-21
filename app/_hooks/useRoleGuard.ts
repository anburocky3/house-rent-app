"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

type GuardRole = "admin" | "tenant";

type GuardProfile = {
  role?: GuardRole;
  _deleted?: boolean;
  [key: string]: unknown;
};

type UseRoleGuardArgs = {
  role: GuardRole;
  redirectTo: string;
};

export function useRoleGuard({ role, redirectTo }: UseRoleGuardArgs) {
  const router = useRouter();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [uid, setUid] = useState("");
  const [profile, setProfile] = useState<GuardProfile | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) {
        return;
      }

      if (!currentUser) {
        setUid("");
        setProfile(null);
        setIsAllowed(false);
        setIsCheckingAccess(false);
        router.replace(redirectTo);
        return;
      }

      try {
        const userSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userSnapshot.exists()
          ? (userSnapshot.data() as GuardProfile)
          : null;
        const hasAccess =
          userData?.role === role && userData?._deleted !== true;

        if (!hasAccess) {
          setUid("");
          setProfile(null);
          setIsAllowed(false);
          router.replace(redirectTo);
          return;
        }

        setUid(currentUser.uid);
        setProfile(userData);
        setIsAllowed(true);
      } catch {
        setUid("");
        setProfile(null);
        setIsAllowed(false);
        router.replace(redirectTo);
      } finally {
        if (active) {
          setIsCheckingAccess(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [redirectTo, role, router]);

  return {
    uid,
    profile,
    isAllowed,
    isCheckingAccess,
  };
}
