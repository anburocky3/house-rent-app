"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import LogoutButton from "../../components/LogoutButton";
import AdminBottomNav from "../_components/AdminBottomNav";
import { useAdminDashboardData } from "../_hooks/useAdminData";

const normalizePhone = (value: string) => value.replace(/\D/g, "");
const upiRegex = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;

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
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName((adminProfile?.full_name as string | undefined) || "");
    setPhoneNumber((adminProfile?.phone_number as string | undefined) || "");
    setUpiId((adminProfile?.upi_id as string | undefined) || "");
    setAddress((adminProfile?.permanent_address as string | undefined) || "");
    setEmergencyContactName(
      (adminProfile?.emergency_contact as { name?: string } | undefined)
        ?.name || "",
    );
    setEmergencyContactPhone(
      (adminProfile?.emergency_contact as { phone?: string } | undefined)
        ?.phone || "",
    );
    setPincode((adminProfile?.pincode as string | undefined) || "");
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

    const cleanName = fullName.trim();
    const cleanPhone = normalizePhone(phoneNumber);
    const cleanUpi = upiId.trim();
    const cleanAddress = address.trim();
    const cleanEmergencyName = emergencyContactName.trim();
    const cleanEmergencyPhone = normalizePhone(emergencyContactPhone);
    const cleanPincode = normalizePhone(pincode);

    if (cleanName.length < 3) {
      setFormError("Owner full name should be at least 3 characters.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setFormError("Phone number should contain exactly 10 digits.");
      return;
    }
    if (cleanUpi && !upiRegex.test(cleanUpi)) {
      setFormError("Enter a valid UPI ID (example: name@bank).");
      return;
    }
    if (cleanAddress.length < 10) {
      setFormError("Owner address should be at least 10 characters.");
      return;
    }
    if (cleanEmergencyPhone.length > 0 && cleanEmergencyPhone.length !== 10) {
      setFormError("Emergency contact phone should contain exactly 10 digits.");
      return;
    }
    if (cleanPincode.length > 0 && cleanPincode.length !== 6) {
      setFormError("Location pincode should contain exactly 6 digits.");
      return;
    }

    setFormError("");
    setSaving(true);
    try {
      await updateSettings({
        full_name: cleanName,
        phone_number: cleanPhone,
        upi_id: cleanUpi,
        permanent_address: cleanAddress,
        emergency_contact_name: cleanEmergencyName,
        emergency_contact_phone: cleanEmergencyPhone,
        pincode: cleanPincode,
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
            <input
              value={pincode}
              onChange={(event) => setPincode(event.target.value)}
              placeholder="Location pincode"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <div className="space-y-2 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                Emergency contact
              </p>
              <input
                value={emergencyContactName}
                onChange={(event) =>
                  setEmergencyContactName(event.target.value)
                }
                placeholder="Emergency contact name"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={emergencyContactPhone}
                onChange={(event) =>
                  setEmergencyContactPhone(event.target.value)
                }
                placeholder="Emergency contact phone"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
            </div>
            {formError ? (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {formError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </form>

          <div className="mt-3 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/40">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
              Properties
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Create, edit, update, and delete property records from the
              dedicated properties page.
            </p>
            <Link
              href="/admin/properties"
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Open properties page
            </Link>
          </div>

          <div className="mt-4">
            <LogoutButton />
          </div>
        </section>
      </main>
      <AdminBottomNav />
    </div>
  );
}
