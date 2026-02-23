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
    properties,
    latestLedgerByProperty,
    updatePropertyCurrentUnits,
    tenants,
    openComplaintsCount,
  } = useAdminDashboardData();
  const [unitInputs, setUnitInputs] = useState<Record<string, string>>({});
  const [savingUnitKey, setSavingUnitKey] = useState("");

  const today = new Date();
  const currentDate = today.getDate();
  const lastDateOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const daysLeft = lastDateOfMonth - currentDate;
  const isMonthEndReminderWindow = daysLeft >= 0 && daysLeft <= 2;
  const monthEndReminderLabel =
    daysLeft === 0
      ? "Today is month end."
      : `${daysLeft + 1} day${daysLeft === 0 ? "" : "s"} left for month end.`;

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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
                Monthly meter update
              </p>
              <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Enter electricity meter units manually at month end. Changes are
                reflected in the tenant dashboard.
              </p>
            </div>
            {isMonthEndReminderWindow ? (
              <span className="shrink-0 rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Reminder
              </span>
            ) : null}
          </div>

          <div
            className={`mt-3 rounded-xl border p-3 ${
              isMonthEndReminderWindow
                ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
                : "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/40"
            }`}
          >
            <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {isMonthEndReminderWindow
                ? `⚠️ Month-end reminder: ${monthEndReminderLabel} Read each property meter and update units.`
                : "Meter readings are usually updated in the last 3 days of each month (29th, 30th, 31st)."}
            </p>
          </div>

          {isLoadingData ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Loading properties...
            </p>
          ) : properties.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No properties available.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {properties.map((property) => {
                const propertyId = property.id;
                const latestLedger = latestLedgerByProperty[propertyId];
                const value =
                  unitInputs[propertyId] ??
                  (latestLedger?.current_meter_reading !== undefined
                    ? String(latestLedger.current_meter_reading)
                    : "");

                return (
                  <div
                    key={propertyId}
                    className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {property.property_nickname || propertyId}
                      </p>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-200">
                        {propertyId}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={value}
                        onChange={(event) =>
                          setUnitInputs((previous) => ({
                            ...previous,
                            [propertyId]: event.target.value,
                          }))
                        }
                        placeholder="Current meter unit"
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-50"
                      />
                      <button
                        type="button"
                        disabled={savingUnitKey === propertyId || !value}
                        onClick={async () => {
                          const parsed = Number(value);
                          if (Number.isNaN(parsed) || parsed < 0) {
                            return;
                          }

                          setSavingUnitKey(propertyId);
                          try {
                            await updatePropertyCurrentUnits(
                              propertyId,
                              parsed,
                            );
                            setUnitInputs((previous) => ({
                              ...previous,
                              [propertyId]: String(parsed),
                            }));
                          } finally {
                            setSavingUnitKey("");
                          }
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                      >
                        {savingUnitKey === propertyId ? "Saving..." : "Save"}
                      </button>
                    </div>
                    <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Last saved unit:{" "}
                      {latestLedger?.current_meter_reading ?? "-"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
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
