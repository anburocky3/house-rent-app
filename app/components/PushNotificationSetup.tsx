"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getToken, onMessage } from "firebase/messaging";
import { auth, db, getClientMessaging } from "../../firebaseConfig";

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    mobile?: boolean;
    platform?: string;
    brands?: Array<{ brand?: string; version?: string }>;
  };
};

type PushNotificationSetupState =
  | "idle"
  | "unsupported"
  | "not-logged-in"
  | "ready"
  | "requesting"
  | "enabled"
  | "blocked"
  | "failed";

const toErrorMessage = (error: unknown) => {
  if (error && typeof error === "object") {
    const maybeCode = "code" in error ? String(error.code || "") : "";
    const maybeMessage = "message" in error ? String(error.message || "") : "";

    if (maybeCode || maybeMessage) {
      return [maybeCode, maybeMessage].filter(Boolean).join(": ");
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

const getValidatedVapidKey = () => {
  const vapidKey = (process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "").trim();

  if (!vapidKey) {
    return {
      key: "",
      error: "Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY in environment.",
    };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(vapidKey) || vapidKey.length < 80) {
    return {
      key: "",
      error:
        "Invalid NEXT_PUBLIC_FIREBASE_VAPID_KEY. Use the Web Push certificate public key from Firebase Cloud Messaging.",
    };
  }

  return {
    key: vapidKey,
    error: "",
  };
};

const getBrowserName = (ua: string, uaData?: NavigatorWithUAData["userAgentData"]) => {
  const brands = uaData?.brands || [];
  const preferredBrand = brands.find((item) => {
    const brand = (item.brand || "").toLowerCase();
    return brand && brand !== "not;a brand";
  });

  if (preferredBrand?.brand) {
    return preferredBrand.brand;
  }

  if (/edg/i.test(ua)) {
    return "Edge";
  }
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
    return "Chrome";
  }
  if (/firefox|fxios/i.test(ua)) {
    return "Firefox";
  }
  if (/safari/i.test(ua) && !/chrome|crios|edg/i.test(ua)) {
    return "Safari";
  }

  return "Unknown Browser";
};

const getDeviceInfo = () => {
  if (typeof navigator === "undefined") {
    return {
      device_name: "Unknown device",
      browser: "Unknown Browser",
      platform: "Unknown Platform",
      is_mobile: false,
      user_agent: "",
    };
  }

  const nav = navigator as NavigatorWithUAData;
  const userAgent = navigator.userAgent || "";
  const platform =
    nav.userAgentData?.platform || navigator.platform || "Unknown Platform";
  const isMobile =
    nav.userAgentData?.mobile ??
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(userAgent);
  const browser = getBrowserName(userAgent, nav.userAgentData);
  const deviceType = isMobile ? "Mobile" : "Desktop";

  return {
    device_name: `${deviceType} • ${browser} • ${platform}`,
    browser,
    platform,
    is_mobile: isMobile,
    user_agent: userAgent,
  };
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const resolveUserDocId = async (authUid: string, email?: string | null) => {
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

  const normalizedPhone = normalizePhone((email || "").split("@")[0] || "");
  if (!normalizedPhone) {
    return "";
  }

  const phoneMatches = await getDocs(
    query(
      collection(db, "users"),
      where("phone_number", "==", normalizedPhone),
    ),
  );

  const activeDoc = phoneMatches.docs.find((item) => {
    const profile = item.data() as { _deleted?: boolean };
    return profile._deleted !== true;
  });

  return activeDoc?.id || "";
};

const getUserRole = async (userDocId: string) => {
  const userDoc = await getDoc(doc(db, "users", userDocId));
  if (userDoc.exists()) {
    const userData = userDoc.data() as { role?: string };
    return userData.role || "user";
  }
  return "user";
};

export default function PushNotificationSetup() {
  const [status, setStatus] = useState<PushNotificationSetupState>("idle");
  const [message, setMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const isSyncingRef = useRef(false);

  const syncFcmTokenToProfile = useCallback(
    async (showSuccessMessage = false) => {
      if (isSyncingRef.current) {
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setStatus("not-logged-in");
        return;
      }

      if (typeof Notification === "undefined") {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission !== "granted") {
        setStatus(Notification.permission === "denied" ? "blocked" : "ready");
        return;
      }

      const { key: vapidKey, error: vapidError } = getValidatedVapidKey();
      if (vapidError) {
        setStatus("failed");
        setMessage(vapidError);
        return;
      }

      isSyncingRef.current = true;
      try {
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );
        await navigator.serviceWorker.ready;

        const messaging = await getClientMessaging();
        if (!messaging) {
          setStatus("unsupported");
          return;
        }

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration,
        });

        if (!token) {
          setStatus("failed");
          setMessage("Unable to get FCM token. Try again.");
          return;
        }

        const userDocId = await resolveUserDocId(
          currentUser.uid,
          currentUser.email,
        );
        if (!userDocId) {
          setStatus("failed");
          setMessage("User profile not found to store FCM token.");
          return;
        }

        const userRole = await getUserRole(userDocId);
        const deviceInfo = getDeviceInfo();

        await setDoc(
          doc(db, "users", userDocId),
          {
            auth_uid: currentUser.uid,
            fcmToken: token,
            fcm_type: userRole,
            fcm_device: {
              ...deviceInfo,
              token_preview: `${token.slice(0, 10)}...${token.slice(-6)}`,
              token_updated_at: serverTimestamp(),
            },
            notification_permission: "granted",
            updated_at: serverTimestamp(),
          },
          { merge: true },
        );

        setStatus("enabled");
        if (showSuccessMessage) {
          setMessage("Push notifications enabled.");
        }
      } catch (error) {
        setStatus("failed");
        setMessage(`Failed to enable notifications: ${toErrorMessage(error)}`);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 768px)");
    const onChange = () => setIsMobile(media.matches);

    onChange();
    media.addEventListener("change", onChange);

    return () => {
      media.removeEventListener("change", onChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const setup = async () => {
      const messaging = await getClientMessaging();
      if (!active) {
        return;
      }
      if (!messaging || typeof Notification === "undefined") {
        setStatus("unsupported");
        return;
      }

      if (!auth.currentUser) {
        setStatus("not-logged-in");
        return;
      }

      if (Notification.permission === "granted") {
        setStatus("enabled");
        void syncFcmTokenToProfile(false);
        return;
      }

      if (Notification.permission === "denied") {
        setStatus("blocked");
        return;
      }

      setStatus("ready");
    };

    void setup();

    return () => {
      active = false;
    };
  }, [syncFcmTokenToProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setStatus("not-logged-in");
        setMessage("");
        return;
      }

      if (Notification.permission === "granted") {
        setStatus("enabled");
        void syncFcmTokenToProfile(false);
      } else if (Notification.permission === "denied") {
        setStatus("blocked");
      } else {
        setStatus("ready");
      }
    });

    return () => unsubscribe();
  }, [syncFcmTokenToProfile]);

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;

    const connectForegroundListener = async () => {
      const messaging = await getClientMessaging();
      if (
        !messaging ||
        !auth.currentUser ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      unsubscribeForeground = onMessage(messaging, (payload) => {
        const title = payload.notification?.title || "Notification";
        const body = payload.notification?.body || "";
        setMessage(body ? `${title}: ${body}` : title);
      });
    };

    void connectForegroundListener();

    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [status]);

  const enableNotifications = async () => {
    setStatus("requesting");
    setMessage("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "blocked" : "ready");
        return;
      }

      await syncFcmTokenToProfile(true);
    } catch (error) {
      setStatus("failed");
      setMessage(`Failed to enable notifications: ${toErrorMessage(error)}`);
    }
  };

  const hidden = useMemo(
    () =>
      status === "unsupported" ||
      status === "not-logged-in" ||
      status === "enabled",
    [status],
  );

  if (hidden) {
    return null;
  }

  if (isMobile) {
    return (
      <button
        type="button"
        onClick={() => {
          void enableNotifications();
        }}
        disabled={status === "requesting"}
        aria-label="Enable push notifications"
        className="fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950 text-lg text-zinc-50 shadow-lg transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        title="Enable notifications"
      >
        🔔
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 w-[min(92vw,360px)] rounded-2xl border border-zinc-300 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/95">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
        Notifications
      </p>
      <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        {status === "enabled"
          ? "Push alerts are enabled for this device."
          : status === "blocked"
            ? "Notifications are blocked in browser settings."
            : "Enable push notifications for rent updates and reminders."}
      </p>

      {message ? (
        <p className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {message}
        </p>
      ) : null}

      {status !== "enabled" ? (
        <button
          type="button"
          onClick={enableNotifications}
          disabled={status === "requesting"}
          className="mt-3 inline-flex min-h-9 w-full items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {status === "requesting" ? "Enabling..." : "Enable notifications"}
        </button>
      ) : null}
    </div>
  );
}
