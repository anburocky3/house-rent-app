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
    tenants,
    latestLedgerByProperty,
    openComplaintsCount,
    updatePropertyCharges,
    updatePropertyCurrentUnits,
  } = useAdminDashboardData();

  const [propertyInputs, setPropertyInputs] = useState<
    Record<
      string,
      {
        rent: string;
        water: string;
        rate: string;
        unit: string;
      }
    >
  >({});
  const [savingKey, setSavingKey] = useState("");

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
            Property rent and billing
          </p>

          {isLoadingData ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Loading property data...
            </p>
          ) : properties.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              No properties found.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {properties.map((property) => {
                const propertyId = property.id;
                const latestLedger = latestLedgerByProperty[propertyId];
                const defaultInput = {
                  rent: String(property.rent_amount ?? 0),
                  water: String(property.water_charge ?? 0),
                  rate: String(property.electricity_rate ?? 0),
                  unit:
                    latestLedger?.current_meter_reading !== undefined
                      ? String(latestLedger.current_meter_reading)
                      : "",
                };
                const currentInput = propertyInputs[propertyId] || defaultInput;

                return (
                  <article
                    key={propertyId}
                    className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      Property ID: {propertyId}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                      {latestLedger?.month_year || "No ledger month"} ·{" "}
                      {latestLedger?.payment_status || "pending"}
                    </p>

                    <div className="mt-3 rounded-xl border border-zinc-300 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                        Property charges
                      </p>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={0}
                          value={currentInput.rent}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                rent: event.target.value,
                              },
                            }))
                          }
                          placeholder="Rent"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <input
                          type="number"
                          min={0}
                          value={currentInput.water}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                water: event.target.value,
                              },
                            }))
                          }
                          placeholder="Water"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <input
                          type="number"
                          min={0}
                          value={currentInput.rate}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                rate: event.target.value,
                              },
                            }))
                          }
                          placeholder="₹/unit"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={savingKey === `${propertyId}:charges`}
                        onClick={async () => {
                          const nextRent = Number(currentInput.rent || 0);
                          const nextWater = Number(currentInput.water || 0);
                          const nextRate = Number(currentInput.rate || 0);
                          if (
                            Number.isNaN(nextRent) ||
                            Number.isNaN(nextWater) ||
                            Number.isNaN(nextRate)
                          ) {
                            return;
                          }

                          setSavingKey(`${propertyId}:charges`);
                          try {
                            await updatePropertyCharges({
                              propertyId,
                              rent_amount: nextRent,
                              water_charge: nextWater,
                              electricity_rate: nextRate,
                            });
                          } finally {
                            setSavingKey("");
                          }
                        }}
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {savingKey === `${propertyId}:charges`
                          ? "Saving charges..."
                          : "Save property charges"}
                      </button>

                      <p className="mt-3 text-zinc-700 dark:text-zinc-300">
                        Latest electricity total: ₹
                        {latestLedger?.electricity_total ?? 0}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={currentInput.unit}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                unit: event.target.value,
                              },
                            }))
                          }
                          placeholder="Current meter unit"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <button
                          type="button"
                          disabled={
                            savingKey === `${propertyId}:unit` ||
                            !currentInput.unit
                          }
                          onClick={async () => {
                            const parsed = Number(currentInput.unit);
                            if (Number.isNaN(parsed)) {
                              return;
                            }

                            setSavingKey(`${propertyId}:unit`);
                            try {
                              await updatePropertyCurrentUnits(
                                propertyId,
                                parsed,
                              );
                            } finally {
                              setSavingKey("");
                            }
                          }}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          {savingKey === `${propertyId}:unit`
                            ? "Saving..."
                            : "Save units"}
                        </button>
                      </div>
                    </div>
                  </article>
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
                    className="rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      {tenant.full_name || tenant.name || "Tenant"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      📞 {tenant.phone_number || "-"}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                      Property ID: {propertyId || "-"}
                    </p>
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
