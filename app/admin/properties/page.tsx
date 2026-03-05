"use client";

import { useMemo, useState } from "react";
import AdminBottomNav from "../_components/AdminBottomNav";
import Image from "next/image";
import { useAdminDashboardData } from "../_hooks/useAdminData";

type PropertyInput = {
  nickname: string;
  contactName: string;
  contactPhone: string;
  street: string;
  ward: string;
  occupiedFrom: string;
  rent: string;
  water: string;
  rate: string;
  advance: string;
  initialMeter?: string;
  terms: string;
  schedule: string;
  fittings: string;
  beforeHandoverImages: string;
  unit: string;
};

type UploadedPropertyImage = {
  url?: string;
};

const isNonNegativeNumber = (value: string) => {
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed >= 0;
};

const isValidPhoneNumber = (value: string) => {
  if (!value.trim()) {
    return true;
  }
  return /^\d{10}$/.test(value.trim().replace(/\D/g, ""));
};

const splitNonEmptyLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const toMultilineContent = (value: unknown) => {
  if (!value) {
    return "";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }
        const title =
          "title" in item && typeof item.title === "string"
            ? item.title.trim()
            : "";
        const description =
          "description" in item && typeof item.description === "string"
            ? item.description.trim()
            : "";

        if (title && description) {
          return `${title}: ${description}`;
        }
        return title || description;
      })
      .filter(Boolean)
      .join("\n");
  }

  return String(value);
};

const getPropertyDetailsValidation = (input: PropertyInput) => {
  if (!input.street.trim()) {
    return "Street name is required.";
  }
  if (!isNonNegativeNumber(input.rent)) {
    return "Rent should be a non-negative number.";
  }
  if (!isNonNegativeNumber(input.water)) {
    return "Water charge should be a non-negative number.";
  }
  if (!isNonNegativeNumber(input.rate)) {
    return "Electricity rate should be a non-negative number.";
  }
  if (input.initialMeter && !isNonNegativeNumber(input.initialMeter)) {
    return "Initial meter reading should be a non-negative number.";
  }
  if (!isNonNegativeNumber(input.advance)) {
    return "Advance paid should be a non-negative number.";
  }
  if (!isValidPhoneNumber(input.contactPhone)) {
    return "Contact phone must have 10 digits.";
  }
  return "";
};

export default function AdminPropertiesPage() {
  const {
    isAllowed,
    isCheckingAccess,
    isLoadingData,
    properties,
    tenants,
    latestLedgerByProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    updatePropertyCurrentUnits,
    markPaymentAsPaid,
  } = useAdminDashboardData();

  const [propertyInputs, setPropertyInputs] = useState<
    Record<string, PropertyInput>
  >({});
  const [newPropertyId, setNewPropertyId] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newWard, setNewWard] = useState("");
  const [newOccupiedFrom, setNewOccupiedFrom] = useState("");
  const [newRent, setNewRent] = useState("0");
  const [newWater, setNewWater] = useState("0");
  const [newRate, setNewRate] = useState("0");
  const [newInitialMeter, setNewInitialMeter] = useState("0");
  const [newAdvance, setNewAdvance] = useState("0");
  const [newTerms, setNewTerms] = useState("");
  const [newSchedule, setNewSchedule] = useState("");
  const [newFittings, setNewFittings] = useState("");
  const [newBeforeHandoverImages, setNewBeforeHandoverImages] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [createError, setCreateError] = useState("");
  const [propertyErrors, setPropertyErrors] = useState<Record<string, string>>(
    {},
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [markingPaymentId, setMarkingPaymentId] = useState("");
  const [paymentMessage, setPaymentMessage] = useState<{
    propertyId: string;
    type: "success" | "error";
    message: string;
  } | null>(null);

  const createValidation = useMemo(() => {
    if (!newPropertyId.trim()) {
      return "Property ID is required.";
    }
    if (!newStreet.trim()) {
      return "Street name is required.";
    }
    if (!isValidPhoneNumber(newContactPhone)) {
      return "Contact phone must have 10 digits.";
    }
    if (!isNonNegativeNumber(newRent)) {
      return "Rent should be a non-negative number.";
    }
    if (!isNonNegativeNumber(newWater)) {
      return "Water charge should be a non-negative number.";
    }
    if (!isNonNegativeNumber(newRate)) {
      return "Electricity rate should be a non-negative number.";
    }
    if (!isNonNegativeNumber(newInitialMeter)) {
      return "Initial meter reading should be a non-negative number.";
    }
    if (!isNonNegativeNumber(newAdvance)) {
      return "Advance paid should be a non-negative number.";
    }
    return "";
  }, [
    newAdvance,
    newContactPhone,
    newInitialMeter,
    newPropertyId,
    newRate,
    newRent,
    newStreet,
    newWater,
  ]);

  const uploadPropertyImage = async (propertyId: string, file: File) => {
    const formData = new FormData();
    formData.append("propertyId", propertyId);
    formData.append("file", file, file.name);

    const response = await fetch("/api/property-images/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload property image");
    }

    const uploaded = (await response.json()) as UploadedPropertyImage;
    return uploaded.url || "";
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
            Properties
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            Property management
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Create, update, and delete property records.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              Create property
            </span>
            <button
              type="button"
              onClick={() => setIsFormOpen((previous) => !previous)}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-expanded={isFormOpen}
              aria-label={
                isFormOpen ? "Collapse property form" : "Expand property form"
              }
            >
              {isFormOpen ? "Close" : "Open"}
            </button>
          </div>
          {isFormOpen && (
            <div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={newPropertyId}
                  onChange={(event) => {
                    setNewPropertyId(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Property ID"
                  className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  value={newNickname}
                  onChange={(event) => {
                    setNewNickname(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Property nickname"
                  className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  value={newContactName}
                  onChange={(event) => {
                    setNewContactName(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Contact person name"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  value={newContactPhone}
                  onChange={(event) => {
                    setNewContactPhone(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Contact person phone"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  value={newStreet}
                  onChange={(event) => {
                    setNewStreet(event.target.value);
                    setCreateError("");
                  }}
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
                  onChange={(event) => {
                    setNewRent(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Rent"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  type="number"
                  min={0}
                  value={newWater}
                  onChange={(event) => {
                    setNewWater(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Water"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  type="number"
                  min={0}
                  value={newRate}
                  onChange={(event) => {
                    setNewRate(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="₹/unit"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  type="number"
                  min={0}
                  value={newInitialMeter}
                  onChange={(event) => {
                    setNewInitialMeter(event.target.value);
                    setCreateError("");
                  }}
                  placeholder="Initial meter"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
                <input
                  type="number"
                  min={0}
                  value={newAdvance}
                  onChange={(event) => {
                    setNewAdvance(event.target.value);
                    setCreateError("");
                  }}
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
                <textarea
                  value={newBeforeHandoverImages}
                  onChange={(event) =>
                    setNewBeforeHandoverImages(event.target.value)
                  }
                  rows={2}
                  placeholder="Before handover image URLs (one per line)"
                  className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
              </div>

              {createError || createValidation ? (
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  {createError || createValidation}
                </p>
              ) : null}

              <button
                type="button"
                disabled={
                  savingKey === "property:create" || Boolean(createValidation)
                }
                onClick={async () => {
                  if (createValidation) {
                    setCreateError(createValidation);
                    return;
                  }

                  setSavingKey("property:create");
                  try {
                    await createProperty({
                      property_id: newPropertyId,
                      property_nickname: newNickname,
                      contact_person_name: newContactName,
                      contact_person_phone: newContactPhone,
                      before_handover_images: splitNonEmptyLines(
                        newBeforeHandoverImages,
                      ),
                      property_occupied_from: newOccupiedFrom,
                      advance_paid: Number(newAdvance || 0),
                      ward_no: newWard,
                      street_name: newStreet,
                      rent_amount: Number(newRent || 0),
                      water_charge: Number(newWater || 0),
                      electricity_rate: Number(newRate || 0),
                      initial_meter_reading: Number(newInitialMeter || 0),
                      terms_and_conditions: newTerms,
                      schedule_of_property: newSchedule,
                      fitting_and_fixtures: newFittings,
                    });
                    setNewPropertyId("");
                    setNewNickname("");
                    setNewContactName("");
                    setNewContactPhone("");
                    setNewStreet("");
                    setNewWard("");
                    setNewOccupiedFrom("");
                    setNewRent("0");
                    setNewWater("0");
                    setNewRate("0");
                    setNewInitialMeter("0");
                    setNewAdvance("0");
                    setNewTerms("");
                    setNewSchedule("");
                    setNewFittings("");
                    setNewBeforeHandoverImages("");
                    setCreateError("");
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
          )}
        </section>

        <section className="space-y-4">
          {isLoadingData ? (
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Loading properties...
              </p>
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                No properties found.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 ">
              {properties.map((property) => {
                const propertyId = property.id;
                const latestLedger = latestLedgerByProperty[propertyId];
                const defaultInput: PropertyInput = {
                  nickname: String(property.property_nickname ?? ""),
                  contactName: String(property.contact_person?.name ?? ""),
                  contactPhone: String(property.contact_person?.phone ?? ""),
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
                  initialMeter: String(property.initial_meter_reading ?? ""),
                  advance: String(property.advance_paid ?? 0),
                  terms: toMultilineContent(property.terms_and_conditions),
                  schedule: toMultilineContent(property.schedule_of_property),
                  fittings: toMultilineContent(property.fitting_and_fixtures),
                  beforeHandoverImages: (property.before_handover_images || [])
                    .map((url) => String(url || "").trim())
                    .filter(Boolean)
                    .join("\n"),
                  unit:
                    latestLedger?.current_meter_reading !== undefined
                      ? String(latestLedger.current_meter_reading)
                      : "",
                };
                const currentInput = propertyInputs[propertyId] || defaultInput;
                const detailsValidation =
                  getPropertyDetailsValidation(currentInput);

                // Determine payment status badge
                const getPaymentStatusBadge = () => {
                  if (!latestLedger) {
                    return {
                      label: "No billing",
                      color:
                        "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
                    };
                  }

                  if (latestLedger.payment_status === "paid") {
                    const paidDate =
                      latestLedger.paid_at &&
                      "toDate" in latestLedger.paid_at &&
                      typeof latestLedger.paid_at.toDate === "function"
                        ? latestLedger.paid_at
                            .toDate()
                            .toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                        : "";
                    return {
                      label: paidDate ? `✓ Paid  – ${paidDate}` : "Paid ✓",
                      color:
                        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    };
                  }

                  if (latestLedger.payment_status === "overdue") {
                    return {
                      label: "Overdue",
                      color:
                        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                    };
                  }

                  return {
                    label: "Pending",
                    color:
                      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                  };
                };

                const paymentBadge = getPaymentStatusBadge();

                // Get tenants for this property
                const propertyTenants = tenants.filter((tenant) => {
                  let tenantPropertyId: string | undefined;
                  if (typeof tenant.property_id === "string") {
                    tenantPropertyId = tenant.property_id;
                  } else if (
                    tenant.property_id &&
                    typeof tenant.property_id === "object" &&
                    "id" in tenant.property_id
                  ) {
                    tenantPropertyId = (tenant.property_id as { id?: string })
                      .id;
                  }
                  return tenantPropertyId === propertyId && !tenant._deleted;
                });

                return (
                  <article
                    key={propertyId}
                    className="group relative rounded-2xl border border-zinc-300 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Main card content with image and details */}
                    <div className="flex gap-4 p-4">
                      {/* Placeholder or first before-handover image */}
                      <div className="shrink-0">
                        {property.before_handover_images &&
                        property.before_handover_images[0] ? (
                          <Image
                            src={property.before_handover_images[0]}
                            alt="Property before handover"
                            width={40}
                            height={60}
                            className="rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-linear-to-br from-zinc-300 to-zinc-400 dark:from-indigo-700 dark:to-indigo-800 flex items-center justify-center"></div>
                        )}
                      </div>

                      {/* Card details */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        {/* Header with Title and Actions */}
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-700 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 truncate">
                              {property.property_nickname || "Unnamed Property"}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                                ID:{" "}
                                <span className="px-1 bg-zinc-800  text-zinc-600 text-xs rounded dark:text-zinc-400">
                                  {propertyId}
                                </span>
                              </p>
                              <span className="font-medium text-xs bg-zinc-800 px-1 text-zinc-600 dark:text-zinc-400">
                                {defaultInput.occupiedFrom}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                // Toggle edit mode for this property
                                const isCurrentlyEditing =
                                  propertyInputs[propertyId] !== undefined;
                                if (isCurrentlyEditing) {
                                  setPropertyInputs((prev) => {
                                    const updated = { ...prev };
                                    delete updated[propertyId];
                                    return updated;
                                  });
                                } else {
                                  setPropertyInputs((prev) => ({
                                    ...prev,
                                    [propertyId]: currentInput,
                                  }));
                                }
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition"
                              title="Edit property"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              disabled={savingKey === `${propertyId}:delete`}
                              onClick={async () => {
                                const shouldDelete = window.confirm(
                                  `Delete property ${propertyId} and all its data?`,
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
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition disabled:opacity-60"
                              title="Delete property"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Summary view content */}
                        {propertyInputs[propertyId] === undefined && (
                          <div className="space-y-2 flex-1">
                            {/* Location Info */}
                            <div>
                              <p className="text-xs uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-400">
                                Location
                              </p>
                              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {property.ward_no
                                  ? `Ward ${property.ward_no} • `
                                  : ""}
                                {property.street_name}
                              </p>
                            </div>

                            {/* Charges Grid */}
                            <div className="grid grid-cols-3 gap-2 py-2">
                              <div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Rent
                                </p>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  ₹{property.rent_amount || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Water
                                </p>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  ₹{property.water_charge || 0}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  Rate
                                </p>
                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                  ₹{property.electricity_rate || 0}/u
                                </p>
                              </div>
                            </div>

                            {/* Tenants Info */}
                            <div className="pt-2">
                              <p className="text-xs uppercase tracking-wider font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                Tenants
                              </p>
                              {propertyTenants.length === 0 ? (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                  No tenants
                                </p>
                              ) : (
                                <div className="space-y-1">
                                  {propertyTenants.map((tenant) => (
                                    <p
                                      key={tenant.uid}
                                      className="text-xs text-zinc-900 dark:text-zinc-200"
                                    >
                                      •{" "}
                                      {tenant.full_name ||
                                        tenant.name ||
                                        "Unknown"}
                                      {tenant.is_primary_tenant && (
                                        <span className="ml-1 text-zinc-500">
                                          (Primary)
                                        </span>
                                      )}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Payment Status Section */}
                            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span
                                  className={`inline-block px-3 py-1.5 rounded-full text-xs font-semibold ${paymentBadge.color}`}
                                >
                                  {paymentBadge.label}
                                </span>
                              </div>

                              {/* Payment Action Buttons */}
                              {latestLedger &&
                                latestLedger.payment_status !== "paid" && (
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      type="button"
                                      disabled={
                                        markingPaymentId === latestLedger.id
                                      }
                                      onClick={async () => {
                                        setMarkingPaymentId(latestLedger.id);
                                        const result = await markPaymentAsPaid(
                                          latestLedger.id,
                                          "offline",
                                        );
                                        setPaymentMessage({
                                          propertyId,
                                          type: result.success
                                            ? "success"
                                            : "error",
                                          message: result.message,
                                        });
                                        setMarkingPaymentId("");
                                        setTimeout(
                                          () => setPaymentMessage(null),
                                          3000,
                                        );
                                      }}
                                      className="flex-1 rounded-lg border border-zinc-900 bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                                    >
                                      {markingPaymentId === latestLedger.id
                                        ? "Processing..."
                                        : "Cash"}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        markingPaymentId === latestLedger.id
                                      }
                                      onClick={async () => {
                                        setMarkingPaymentId(latestLedger.id);
                                        const result = await markPaymentAsPaid(
                                          latestLedger.id,
                                          "online",
                                        );
                                        setPaymentMessage({
                                          propertyId,
                                          type: result.success
                                            ? "success"
                                            : "error",
                                          message: result.message,
                                        });
                                        setMarkingPaymentId("");
                                        setTimeout(
                                          () => setPaymentMessage(null),
                                          3000,
                                        );
                                      }}
                                      className="flex-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                                    >
                                      {markingPaymentId === latestLedger.id
                                        ? "Processing..."
                                        : "UPI"}
                                    </button>
                                  </div>
                                )}

                              {/* Payment Message */}
                              {paymentMessage &&
                                paymentMessage.propertyId === propertyId && (
                                  <div
                                    className={`mt-2 rounded-lg border p-2 text-xs font-semibold ${
                                      paymentMessage.type === "success"
                                        ? "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                                        : "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300"
                                    }`}
                                  >
                                    {paymentMessage.type === "success"
                                      ? "✓ "
                                      : "✗ "}
                                    {paymentMessage.message}
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit Form - Expandable Section */}
                    {propertyInputs[propertyId] !== undefined && (
                      <div className="p-4 space-y-3 border-t border-zinc-200 dark:border-zinc-700">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={currentInput.nickname}
                            onChange={(event) =>
                              setPropertyInputs((previous) => ({
                                ...previous,
                                [propertyId]: {
                                  ...currentInput,
                                  nickname: event.target.value,
                                },
                              }))
                            }
                            placeholder="Property nickname"
                            className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                          />
                          <input
                            value={currentInput.contactName}
                            onChange={(event) =>
                              setPropertyInputs((previous) => ({
                                ...previous,
                                [propertyId]: {
                                  ...currentInput,
                                  contactName: event.target.value,
                                },
                              }))
                            }
                            placeholder="Contact person name"
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                          />
                          <input
                            value={currentInput.contactPhone}
                            onChange={(event) =>
                              setPropertyInputs((previous) => ({
                                ...previous,
                                [propertyId]: {
                                  ...currentInput,
                                  contactPhone: event.target.value,
                                },
                              }))
                            }
                            placeholder="Contact person phone"
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                          />
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
                            placeholder="Street name"
                            className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
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
                            placeholder="Ward no"
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
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
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
                            value={currentInput.initialMeter || ""}
                            onChange={(event) =>
                              setPropertyInputs((previous) => ({
                                ...previous,
                                [propertyId]: {
                                  ...currentInput,
                                  initialMeter: event.target.value,
                                },
                              }))
                            }
                            placeholder="Initial meter"
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
                            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
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
                            className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
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
                            className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
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
                            className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                          />
                          <textarea
                            value={currentInput.beforeHandoverImages}
                            onChange={(event) =>
                              setPropertyInputs((previous) => ({
                                ...previous,
                                [propertyId]: {
                                  ...currentInput,
                                  beforeHandoverImages: event.target.value,
                                },
                              }))
                            }
                            rows={2}
                            placeholder="Before handover image URLs (one per line)"
                            className="col-span-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
                          />
                          <label className="col-span-2 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
                            {savingKey === `${propertyId}:images`
                              ? "Uploading images..."
                              : "Upload before handover images"}
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              disabled={savingKey === `${propertyId}:images`}
                              onChange={async (event) => {
                                const files = Array.from(
                                  event.target.files || [],
                                );
                                event.target.value = "";
                                if (files.length === 0) {
                                  return;
                                }

                                setSavingKey(`${propertyId}:images`);
                                setPropertyErrors((previous) => ({
                                  ...previous,
                                  [propertyId]: "",
                                }));

                                try {
                                  const uploadedUrls = await Promise.all(
                                    files.map((file) =>
                                      uploadPropertyImage(propertyId, file),
                                    ),
                                  );

                                  const mergedUrls = Array.from(
                                    new Set([
                                      ...splitNonEmptyLines(
                                        currentInput.beforeHandoverImages,
                                      ),
                                      ...uploadedUrls.filter(Boolean),
                                    ]),
                                  );

                                  setPropertyInputs((previous) => ({
                                    ...previous,
                                    [propertyId]: {
                                      ...(previous[propertyId] || currentInput),
                                      beforeHandoverImages:
                                        mergedUrls.join("\n"),
                                    },
                                  }));
                                } catch {
                                  setPropertyErrors((previous) => ({
                                    ...previous,
                                    [propertyId]:
                                      "Failed to upload one or more images.",
                                  }));
                                } finally {
                                  setSavingKey("");
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {propertyErrors[propertyId] || detailsValidation ? (
                          <p className="text-xs font-medium text-red-600 dark:text-red-400">
                            {propertyErrors[propertyId] || detailsValidation}
                          </p>
                        ) : null}

                        {/* Meter Update Section */}
                        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
                          <label className="text-xs font-semibold uppercase text-zinc-600 dark:text-zinc-400">
                            Update meter reading
                          </label>
                          <div className="flex items-center gap-2 mt-2">
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
                              className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
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
                              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-xs font-bold text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                              {savingKey === `${propertyId}:unit`
                                ? "Saving..."
                                : "Update"}
                            </button>
                          </div>
                        </div>

                        {/* Save and Cancel Buttons */}
                        <div className="flex items-center gap-2 border-t border-zinc-200 dark:border-zinc-700 pt-3">
                          <button
                            type="button"
                            disabled={savingKey === `${propertyId}:details`}
                            onClick={async () => {
                              if (detailsValidation) {
                                setPropertyErrors((previous) => ({
                                  ...previous,
                                  [propertyId]: detailsValidation,
                                }));
                                return;
                              }

                              setSavingKey(`${propertyId}:details`);
                              setPropertyErrors((previous) => ({
                                ...previous,
                                [propertyId]: "",
                              }));
                              try {
                                await updateProperty({
                                  propertyId,
                                  property_nickname: currentInput.nickname,
                                  contact_person_name: currentInput.contactName,
                                  contact_person_phone:
                                    currentInput.contactPhone,
                                  before_handover_images: splitNonEmptyLines(
                                    currentInput.beforeHandoverImages,
                                  ),
                                  property_occupied_from:
                                    currentInput.occupiedFrom,
                                  advance_paid: Number(
                                    currentInput.advance || 0,
                                  ),
                                  ward_no: currentInput.ward,
                                  street_name: currentInput.street,
                                  rent_amount: Number(currentInput.rent || 0),
                                  water_charge: Number(currentInput.water || 0),
                                  electricity_rate: Number(
                                    currentInput.rate || 0,
                                  ),
                                  initial_meter_reading: Number(
                                    currentInput.initialMeter || 0,
                                  ),
                                  terms_and_conditions: currentInput.terms,
                                  schedule_of_property: currentInput.schedule,
                                  fitting_and_fixtures: currentInput.fittings,
                                });

                                // Close edit form on success
                                setPropertyInputs((prev) => {
                                  const updated = { ...prev };
                                  delete updated[propertyId];
                                  return updated;
                                });
                              } finally {
                                setSavingKey("");
                              }
                            }}
                            className="flex-1 inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                          >
                            {savingKey === `${propertyId}:details`
                              ? "Saving..."
                              : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPropertyInputs((prev) => {
                                const updated = { ...prev };
                                delete updated[propertyId];
                                return updated;
                              });
                            }}
                            className="flex-1 inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
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
