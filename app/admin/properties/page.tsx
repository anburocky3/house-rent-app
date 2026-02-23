"use client";

import { useMemo, useState } from "react";
import AdminBottomNav from "../_components/AdminBottomNav";
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
    latestLedgerByProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    updatePropertyCurrentUnits,
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
  const [isFormOpen, setIsFormOpen] = useState(true);

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
    if (!isNonNegativeNumber(newAdvance)) {
      return "Advance paid should be a non-negative number.";
    }
    return "";
  }, [
    newAdvance,
    newContactPhone,
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

        <section className="rounded-2xl border border-zinc-300 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
            Existing properties
          </p>
          {isLoadingData ? (
            <p className="mt-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Loading properties...
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

                    <div className="mt-3 grid grid-cols-2 gap-2">
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
                            const files = Array.from(event.target.files || []);
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
                                  beforeHandoverImages: mergedUrls.join("\n"),
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
                      <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                        {propertyErrors[propertyId] || detailsValidation}
                      </p>
                    ) : null}

                    <div className="mt-3 grid grid-cols-2 gap-2">
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
                              contact_person_phone: currentInput.contactPhone,
                              before_handover_images: splitNonEmptyLines(
                                currentInput.beforeHandoverImages,
                              ),
                              property_occupied_from: currentInput.occupiedFrom,
                              advance_paid: Number(currentInput.advance || 0),
                              ward_no: currentInput.ward,
                              street_name: currentInput.street,
                              rent_amount: Number(currentInput.rent || 0),
                              water_charge: Number(currentInput.water || 0),
                              electricity_rate: Number(currentInput.rate || 0),
                              terms_and_conditions: currentInput.terms,
                              schedule_of_property: currentInput.schedule,
                              fitting_and_fixtures: currentInput.fittings,
                            });
                          } finally {
                            setSavingKey("");
                          }
                        }}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {savingKey === `${propertyId}:details`
                          ? "Saving..."
                          : "Update"}
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
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingKey === `${propertyId}:delete`
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
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
