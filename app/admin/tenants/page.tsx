"use client";

import { FormEvent, useState } from "react";
import AdminBottomNav from "../_components/AdminBottomNav";
import { useAdminDashboardData } from "../_hooks/useAdminData";

const getRefId = (value?: { id?: string } | string) => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    const segments = value.split("/").filter(Boolean);
    return segments[segments.length - 1] || "";
  }
  return value.id || "";
};

export default function AdminTenantsPage() {
  const {
    isAllowed,
    isCheckingAccess,
    isLoadingData,
    tenants,
    properties,
    saveTenant,
    deleteTenant,
  } = useAdminDashboardData();
  const [editingTenantUid, setEditingTenantUid] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [isPrimaryTenant, setIsPrimaryTenant] = useState(true);
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState("");

  if (isCheckingAccess || !isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-sm text-zinc-600 dark:text-zinc-300">
        Verifying access...
      </div>
    );
  }

  const resetForm = () => {
    setEditingTenantUid("");
    setFullName("");
    setPhoneNumber("");
    setPropertyId("");
    setIsPrimaryTenant(true);
    setAddress("");
    setPincode("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim() || !propertyId) {
      return;
    }

    setSaving(true);
    try {
      await saveTenant({
        uid: editingTenantUid || undefined,
        full_name: fullName,
        phone_number: phoneNumber,
        propertyId,
        is_primary_tenant: isPrimaryTenant,
        permanent_address: address,
        pincode,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 px-4 pb-24 pt-6 font-sans text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="rounded-3xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Tenants
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Tenant list
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            View all tenant records and linked property IDs.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form className="space-y-3" onSubmit={onSubmit}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              {editingTenantUid ? "Edit tenant" : "Add tenant"}
            </p>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="Phone number"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <select
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            >
              <option value="">Select property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.id}
                </option>
              ))}
            </select>
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Permanent address"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <input
              value={pincode}
              onChange={(event) => setPincode(event.target.value)}
              placeholder="Pincode"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={isPrimaryTenant}
                onChange={(event) => setIsPrimaryTenant(event.target.checked)}
              />
              Is primary tenant
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                {saving ? "Saving..." : editingTenantUid ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {isLoadingData ? (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Loading tenants...
            </p>
          ) : tenants.length === 0 ? (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No tenants found.
            </p>
          ) : (
            <div className="space-y-3">
              {tenants.map((tenant) => (
                <article
                  key={tenant.uid}
                  className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                >
                  <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                    {tenant.full_name || tenant.name || "Tenant"}
                  </p>
                  <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    📞 {tenant.phone_number || "-"}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                    Property ID: {getRefId(tenant.property_id) || "-"}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTenantUid(tenant.uid);
                        setFullName(tenant.full_name || tenant.name || "");
                        setPhoneNumber(tenant.phone_number || "");
                        setPropertyId(getRefId(tenant.property_id));
                        setIsPrimaryTenant(Boolean(tenant.is_primary_tenant));
                        setAddress(tenant.permanent_address || "");
                        setPincode(tenant.pincode || "");
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingUid === tenant.uid}
                      onClick={async () => {
                        setDeletingUid(tenant.uid);
                        try {
                          await deleteTenant(tenant.uid);
                          if (editingTenantUid === tenant.uid) {
                            resetForm();
                          }
                        } finally {
                          setDeletingUid("");
                        }
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingUid === tenant.uid ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <AdminBottomNav />
    </div>
  );
}
