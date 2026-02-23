"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
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
        let matchedDocId = "";
        let userData: GuardProfile | null = null;

        const directSnapshot = await getDoc(doc(db, "users", currentUser.uid));
        if (directSnapshot.exists()) {
          matchedDocId = currentUser.uid;
          userData = directSnapshot.data() as GuardProfile;
        }

        if (!userData) {
          const authUidMatches = await getDocs(
            query(
              collection(db, "users"),
              where("auth_uid", "==", currentUser.uid),
            ),
          );

          const activeMatch = authUidMatches.docs.find((item) => {
            const profile = item.data() as GuardProfile;
            return profile._deleted !== true;
          });

          if (activeMatch) {
            matchedDocId = activeMatch.id;
            userData = activeMatch.data() as GuardProfile;
          }
        }

        if (!userData) {
          const emailPrefix = (currentUser.email || "").split("@")[0] || "";
          const normalizedPhone = emailPrefix.replace(/\D/g, "");

          if (normalizedPhone) {
            const phoneMatches = await getDocs(
              query(
                collection(db, "users"),
                where("role", "==", role),
                where("phone_number", "==", normalizedPhone),
              ),
            );

            const activePhoneMatch = phoneMatches.docs.find((item) => {
              const profile = item.data() as GuardProfile;
              return profile._deleted !== true;
            });

            if (activePhoneMatch) {
              matchedDocId = activePhoneMatch.id;
              userData = activePhoneMatch.data() as GuardProfile;

              await setDoc(
                doc(db, "users", matchedDocId),
                {
                  auth_uid: currentUser.uid,
                  updated_at: serverTimestamp(),
                },
                { merge: true },
              );
            }
          }
        }

        const hasAccess =
          userData?.role === role && userData?._deleted !== true && Boolean(matchedDocId);

        if (!hasAccess) {
          setUid("");
          setProfile(null);
          setIsAllowed(false);
          router.replace(redirectTo);
          return;
        }

        setUid(matchedDocId);
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
