"use client";

import { useState } from "react";
import LogoutButton from "../components/LogoutButton";
import AdminBottomNav from "./_components/AdminBottomNav";
import { useAdminDashboardData } from "./_hooks/useAdminData";

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

export default function AdminDashboard() {
  const {
    isAllowed,
    isCheckingAccess,
    isLoadingData,
    adminName,
    tenants,
    openComplaintsCount,
  } = useAdminDashboardData();

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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                Admin dashboard
              </p>
              <p className="mt-2 text-base font-semibold tracking-tight">
                Hi, {adminName}
              </p>
            </div>
            <LogoutButton />
          </div>

          <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Update property-level charges and monthly meter details.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <article className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Tenants
            </p>
            <p className="mt-2 text-2xl font-extrabold">{tenants.length}</p>
          </article>
          <article className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Open complaints
            </p>
            <p className="mt-2 text-2xl font-extrabold">
              {openComplaintsCount}
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Tenant information
          </p>

          {isLoadingData ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Loading tenant data...
            </p>
          ) : tenants.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No tenant records found.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {tenants.map((tenant) => {
                const propertyId = getRefId(tenant.property_id);
                return (
                  <article
                    key={tenant.uid}
                    className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40 "
                  >
                    <div className="text-base font-bold text-zinc-600 dark:text-zinc-50 flex justify-between items-center">
                      <span>
                        {tenant.full_name || tenant.name || "Tenant"}{" "}
                      </span>
                      <span className="bg-zinc-800 text-zinc-400 px-2 rounded text-xs">
                        {propertyId || "-"}
                      </span>
                    </div>
                    <a
                      href={`tel:${tenant.phone_number}`}
                      className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-500"
                    >
                      📞 {tenant.phone_number || "-"}
                    </a>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <AdminBottomNav />
    </div>
  );
}
