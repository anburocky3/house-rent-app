"use client";

import { FormEvent, useEffect, useState } from "react";
import LogoutButton from "../../components/LogoutButton";
import AdminBottomNav from "../_components/AdminBottomNav";
import { useAdminDashboardData } from "../_hooks/useAdminData";

export default function AdminSettingsPage() {
  const {
    isAllowed,
    isCheckingAccess,
    adminName,
    adminProfile,
    updateSettings,
  } = useAdminDashboardData();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [upiId, setUpiId] = useState("");
  const [address, setAddress] = useState("");
  const [tenantTerms, setTenantTerms] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName((adminProfile?.full_name as string | undefined) || "");
    setPhoneNumber((adminProfile?.phone_number as string | undefined) || "");
    setUpiId((adminProfile?.upi_id as string | undefined) || "");
    setAddress((adminProfile?.permanent_address as string | undefined) || "");
    setTenantTerms((adminProfile?.tenant_terms as string | undefined) || "");
  }, [adminProfile]);

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        full_name: fullName,
        phone_number: phoneNumber,
        upi_id: upiId,
        permanent_address: address,
        tenant_terms: tenantTerms,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Admin settings
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Manage account and owner-level controls.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Signed in as
          </p>
          <p className="mt-1 text-lg font-bold">{adminName}</p>

          <form className="mt-4 space-y-3" onSubmit={onSubmit}>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Owner full name"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="Phone number"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <input
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="UPI ID"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Owner address"
              rows={2}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <textarea
              value={tenantTerms}
              onChange={(event) => setTenantTerms(event.target.value)}
              placeholder="Terms and conditions for tenants"
              rows={6}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </form>

          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      </main>
      <AdminBottomNav />
    </div>
  );
}
