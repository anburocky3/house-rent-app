import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebaseConfig";

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export const resolveUserDocId = async (
  authUid: string,
  email?: string | null,
) => {
  const directDoc = await getDoc(doc(db, "users", authUid));
  if (directDoc.exists()) {
    return directDoc.id;
  }

  const authUidMatches = await getDocs(
    query(collection(db, "users"), where("auth_uid", "==", authUid)),
  );
  if (!authUidMatches.empty) {
    return authUidMatches.docs[0]?.id || "";
  }

  const normalizedPhone_ = normalizePhone((email || "").split("@")[0] || "");
  if (!normalizedPhone_) {
    return "";
  }

  const phoneMatches = await getDocs(
    query(
      collection(db, "users"),
      where("phone_number", "==", normalizedPhone_),
    ),
  );

  const activeDoc = phoneMatches.docs.find((item) => {
    const profile = item.data() as { _deleted?: boolean };
    return profile._deleted !== true;
  });

  return activeDoc?.id || "";
};

export const disableNotifications = async (
  authUid: string,
  email?: string | null,
) => {
  try {
    const userDocId = await resolveUserDocId(authUid, email);
    if (!userDocId) {
      throw new Error("User profile not found.");
    }

    await setDoc(
      doc(db, "users", userDocId),
      {
        fcmToken: null,
        fcm_type: null,
        fcm_device: null,
        notification_permission: "denied",
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true, message: "Push notifications disabled." };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to disable notifications";
    return { success: false, message: errorMessage };
  }
};

export const getNotificationStatus = async (userDocId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userDocId));
    if (!userDoc.exists()) {
      return { isEnabled: false };
    }

    const userData = userDoc.data() as { fcmToken?: string };
    return {
      isEnabled: !!userData.fcmToken && userData.fcmToken.trim().length > 0,
    };
  } catch (error) {
    console.error("Error getting notification status:", error);
    return { isEnabled: false };
  }
};
