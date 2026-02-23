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
    createProperty,
    updateProperty,
    deleteProperty,
    updatePropertyCurrentUnits,
  } = useAdminDashboardData();

  const [propertyInputs, setPropertyInputs] = useState<
    Record<
      string,
      {
        street: string;
        ward: string;
        occupiedFrom: string;
        rent: string;
        water: string;
        rate: string;
        advance: string;
        terms: string;
        schedule: string;
        fittings: string;
        unit: string;
      }
    >
  >({});
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newWard, setNewWard] = useState("");
  const [newOccupiedFrom, setNewOccupiedFrom] = useState("");
  const [newRent, setNewRent] = useState("0");
  const [newWater, setNewWater] = useState("0");
  const [newRate, setNewRate] = useState("0");
  const [newAdvance, setNewAdvance] = useState("0");
  const [newTerms, setNewTerms] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newFittings, setNewFittings] = useState("");
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

          <div className="mt-3 rounded-2xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Create property
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <input
                value={newPropertyId}
                onChange={(event) => setNewPropertyId(event.target.value)}
                placeholder="Property ID"
                className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={newStreet}
                onChange={(event) => setNewStreet(event.target.value)}
                placeholder="Street name"
                className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={newWard}
                onChange={(event) => setNewWard(event.target.value)}
                placeholder="Ward no"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                type="date"
                value={newOccupiedFrom}
                onChange={(event) => setNewOccupiedFrom(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                type="number"
                min={0}
                value={newRent}
                onChange={(event) => setNewRent(event.target.value)}
                placeholder="Rent"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                type="number"
                min={0}
                value={newWater}
                onChange={(event) => setNewWater(event.target.value)}
                placeholder="Water"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                type="number"
                min={0}
                value={newRate}
                onChange={(event) => setNewRate(event.target.value)}
                placeholder="₹/unit"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                type="number"
                min={0}
                value={newAdvance}
                onChange={(event) => setNewAdvance(event.target.value)}
                placeholder="Advance"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <textarea
                value={newTerms}
                onChange={(event) => setNewTerms(event.target.value)}
                rows={2}
                placeholder="Terms and conditions"
                className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <textarea
                value={newSchedule}
                onChange={(event) => setNewSchedule(event.target.value)}
                rows={2}
                placeholder="Schedule of property"
                className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <textarea
                value={newFittings}
                onChange={(event) => setNewFittings(event.target.value)}
                rows={2}
                placeholder="Fittings and fixtures"
                className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
            </div>
            <button
              type="button"
              disabled={savingKey === "property:create"}
              onClick={async () => {
                const nextRent = Number(newRent || 0);
                const nextWater = Number(newWater || 0);
                const nextRate = Number(newRate || 0);
                const nextAdvance = Number(newAdvance || 0);
                if (
                  !newPropertyId.trim() ||
                  !newStreet.trim() ||
                  Number.isNaN(nextRent) ||
                  Number.isNaN(nextWater) ||
                  Number.isNaN(nextRate) ||
                  Number.isNaN(nextAdvance)
                ) {
                  return;
                }

                setSavingKey("property:create");
                try {
                  await createProperty({
                    property_id: newPropertyId,
                    property_occupied_from: newOccupiedFrom,
                    advance_paid: nextAdvance,
                    ward_no: newWard,
                    street_name: newStreet,
                    rent_amount: nextRent,
                    water_charge: nextWater,
                    electricity_rate: nextRate,
                    terms_and_conditions: newTerms,
                    schedule_of_property: newSchedule,
                    fitting_and_fixtures: newFittings,
                  });
                  setNewPropertyId("");
                  setNewStreet("");
                  setNewWard("");
                  setNewOccupiedFrom("");
                  setNewRent("0");
                  setNewWater("0");
                  setNewRate("0");
                  setNewAdvance("0");
                  setNewTerms("");
                  setNewSchedule("");
                  setNewFittings("");
                } finally {
                  setSavingKey("");
                }
              }}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              {savingKey === "property:create"
                ? "Creating..."
                : "Create property"}
            </button>
          </div>

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
                  street: String(property.street_name ?? ""),
                  ward: String(property.ward_no ?? ""),
                  occupiedFrom:
                    property.property_occupied_from &&
                    "toDate" in property.property_occupied_from &&
                    typeof property.property_occupied_from.toDate === "function"
                      ? property.property_occupied_from
                          .toDate()
                          ?.toISOString()
                          ?.slice(0, 10) || ""
                      : "",
                  rent: String(property.rent_amount ?? 0),
                  water: String(property.water_charge ?? 0),
                  rate: String(property.electricity_rate ?? 0),
                  advance: String(property.advance_paid ?? 0),
                  terms: String(property.terms_and_conditions ?? ""),
                  schedule: String(property.schedule_of_property ?? ""),
                  fittings: String(property.fitting_and_fixtures ?? ""),
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
                      Property ID:{" "}
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs">
                        {propertyId}
                      </span>
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
                          value={currentInput.street}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                street: event.target.value,
                              },
                            }))
                          }
                          placeholder="Street"
                          className="col-span-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <input
                          value={currentInput.ward}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                ward: event.target.value,
                              },
                            }))
                          }
                          placeholder="Ward"
                          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <input
                          type="date"
                          value={currentInput.occupiedFrom}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                occupiedFrom: event.target.value,
                              },
                            }))
                          }
                          className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
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
                        <input
                          type="number"
                          min={0}
                          value={currentInput.advance}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                advance: event.target.value,
                              },
                            }))
                          }
                          placeholder="Advance"
                          className="col-span-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <textarea
                          value={currentInput.terms}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                terms: event.target.value,
                              },
                            }))
                          }
                          rows={2}
                          placeholder="Terms and conditions"
                          className="col-span-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <textarea
                          value={currentInput.schedule}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                schedule: event.target.value,
                              },
                            }))
                          }
                          rows={2}
                          placeholder="Schedule of property"
                          className="col-span-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                        <textarea
                          value={currentInput.fittings}
                          onChange={(event) =>
                            setPropertyInputs((previous) => ({
                              ...previous,
                              [propertyId]: {
                                ...currentInput,
                                fittings: event.target.value,
                              },
                            }))
                          }
                          rows={2}
                          placeholder="Fittings and fixtures"
                          className="col-span-3 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={savingKey === `${propertyId}:details`}
                        onClick={async () => {
                          const nextRent = Number(currentInput.rent || 0);
                          const nextWater = Number(currentInput.water || 0);
                          const nextRate = Number(currentInput.rate || 0);
                          const nextAdvance = Number(currentInput.advance || 0);
                          if (
                            Number.isNaN(nextRent) ||
                            Number.isNaN(nextWater) ||
                            Number.isNaN(nextRate) ||
                            Number.isNaN(nextAdvance)
                          ) {
                            return;
                          }

                          setSavingKey(`${propertyId}:details`);
                          try {
                            await updateProperty({
                              propertyId: propertyId,
                              property_occupied_from: currentInput.occupiedFrom,
                              advance_paid: nextAdvance,
                              ward_no: currentInput.ward,
                              street_name: currentInput.street,
                              rent_amount: nextRent,
                              water_charge: nextWater,
                              electricity_rate: nextRate,
                              terms_and_conditions: currentInput.terms,
                              schedule_of_property: currentInput.schedule,
                              fitting_and_fixtures: currentInput.fittings,
                            });
                          } finally {
                            setSavingKey("");
                          }
                        }}
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {savingKey === `${propertyId}:details`
                          ? "Saving property..."
                          : "Save property details"}
                      </button>

                      <button
                        type="button"
                        disabled={savingKey === `${propertyId}:delete`}
                        onClick={async () => {
                          const shouldDelete = window.confirm(
                            `Delete property ${propertyId}?`,
                          );
                          if (!shouldDelete) {
                            return;
                          }

                          setSavingKey(`${propertyId}:delete`);
                          try {
                            await deleteProperty(propertyId);
                          } finally {
                            setSavingKey("");
                          }
                        }}
                        className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingKey === `${propertyId}:delete`
                          ? "Deleting..."
                          : "Delete property"}
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
