"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebaseConfig";
import LogoutButton from "../../components/LogoutButton";
import TenantBottomNav from "../_components/TenantBottomNav";
import {
  disableNotifications,
  resolveUserDocId,
} from "@/lib/notificationUtils";
import { useTenantDashboardData } from "../_hooks/useTenantDashboardData";

export default function TenantSettingsPage() {
  const { isAllowed, isCheckingAccess, tenantName } = useTenantDashboardData();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [disablingNotifications, setDisablingNotifications] = useState(false);

  const checkNotificationStatus = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }

    try {
      const userDocId = await resolveUserDocId(
        currentUser.uid,
        currentUser.email,
      );
      if (!userDocId) {
        return;
      }

      const userDoc = await getDoc(doc(db, "users", userDocId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as { fcmToken?: string };
        setNotificationsEnabled(
          !!userData.fcmToken && userData.fcmToken.trim().length > 0,
        );
      }
    } catch (error) {
      console.error("Error checking notification status:", error);
    }
  }, []);

  useEffect(() => {
    void checkNotificationStatus();
  }, [checkNotificationStatus]);

  const handleDisableNotifications = async () => {
    if (!notificationsEnabled) {
      return;
    }

    setDisablingNotifications(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDisablingNotifications(false);
      return;
    }

    try {
      const result = await disableNotifications(
        currentUser.uid,
        currentUser.email,
      );
      if (result.success) {
        setNotificationsEnabled(false);
      }
    } finally {
      setDisablingNotifications(false);
    }
  };

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            My settings
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Manage your account and notification preferences.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Signed in as
          </p>
          <p className="mt-1 text-lg font-bold">{tenantName}</p>

          <div className="mt-4 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
              Notifications
            </p>
            <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
              Status:{" "}
              <span
                className={
                  notificationsEnabled
                    ? "font-semibold text-green-600 dark:text-green-400"
                    : "font-semibold text-zinc-600 dark:text-zinc-400"
                }
              >
                {notificationsEnabled ? "✓ Enabled" : "Disabled"}
              </span>
            </p>
            {notificationsEnabled ? (
              <button
                type="button"
                onClick={() => {
                  void handleDisableNotifications();
                }}
                disabled={disablingNotifications}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 text-sm font-bold text-red-900 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950"
              >
                {disablingNotifications
                  ? "Disabling..."
                  : "Disable notifications"}
              </button>
            ) : null}
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              {notificationsEnabled
                ? "You will receive real-time notifications about rent payments, meter updates, and important announcements."
                : "Enable notifications to receive updates about your rent, payments, and property information."}
            </p>
          </div>

          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      </main>
      <TenantBottomNav />
    </div>
  );
}
