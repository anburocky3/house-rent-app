"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, SubmitEvent, useState } from "react";
import AdminBottomNav from "../_components/AdminBottomNav";
import {
  type TenantDocument,
  useAdminDashboardData,
} from "../_hooks/useAdminData";
import { calculateAge } from "@/lib/helpers";

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

const toDateInputValue = (
  value?: { toDate?: () => Date } | Date | string | null,
) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const datePart = value.split("T")[0] || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return parsed.toISOString().slice(0, 10);
  }

  const date = value instanceof Date ? value : value.toDate?.();
  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianAddress, setGuardianAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [aadhaarCardFile, setAadhaarCardFile] = useState<File | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  const [existingProfilePhotoUrl, setExistingProfilePhotoUrl] = useState("");
  const [existingProfilePhotoStoragePath, setExistingProfilePhotoStoragePath] =
    useState("");
  const [existingAadhaarPhotoUrl, setExistingAadhaarPhotoUrl] = useState("");
  const [existingAadhaarPhotoStoragePath, setExistingAadhaarPhotoStoragePath] =
    useState("");
  const [existingSupportingDocuments, setExistingSupportingDocuments] =
    useState<TenantDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingUid, setDeletingUid] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(true);

  const onPickProfilePicture = (event: ChangeEvent<HTMLInputElement>) => {
    setProfilePictureFile(event.target.files?.[0] || null);
  };

  const onPickAadhaarCard = (event: ChangeEvent<HTMLInputElement>) => {
    setAadhaarCardFile(event.target.files?.[0] || null);
  };

  const onPickSupportingFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setSupportingFiles(Array.from(event.target.files || []));
  };

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
    setGender("");
    setDob("");
    setFatherName("");
    setAadhaarNumber("");
    setGuardianName("");
    setGuardianRelationship("");
    setGuardianPhone("");
    setGuardianAddress("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setProfilePictureFile(null);
    setAadhaarCardFile(null);
    setSupportingFiles([]);
    setExistingProfilePhotoUrl("");
    setExistingProfilePhotoStoragePath("");
    setExistingAadhaarPhotoUrl("");
    setExistingAadhaarPhotoStoragePath("");
    setExistingSupportingDocuments([]);
  };

  const onSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
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
        gender,
        dob,
        father_name: fatherName,
        aadhaar_number: aadhaarNumber,
        guardian_name: guardianName,
        guardian_relationship: guardianRelationship,
        guardian_phone: guardianPhone,
        guardian_address: guardianAddress,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        profile_picture_file: profilePictureFile,
        aadhaar_card_file: aadhaarCardFile,
        supporting_documents: supportingFiles,
        existing_profile_photo_url: existingProfilePhotoUrl,
        existing_profile_photo_storage_path: existingProfilePhotoStoragePath,
        existing_aadhaar_photo_url: existingAadhaarPhotoUrl,
        existing_aadhaar_photo_storage_path: existingAadhaarPhotoStoragePath,
        existing_supporting_documents: existingSupportingDocuments,
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
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300">
              {editingTenantUid ? "Edit tenant" : "Add tenant"}
            </p>
            <button
              type="button"
              onClick={() => setIsFormOpen((previous) => !previous)}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-expanded={isFormOpen}
              aria-label={
                isFormOpen ? "Collapse tenant form" : "Expand tenant form"
              }
            >
              {isFormOpen ? "Close" : "Open"}
            </button>
          </div>

          {isFormOpen ? (
            <form className="space-y-3" onSubmit={onSubmit}>
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
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                value={dob}
                onChange={(event) => setDob(event.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={fatherName}
                onChange={(event) => setFatherName(event.target.value)}
                placeholder="Father name"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={aadhaarNumber}
                onChange={(event) => setAadhaarNumber(event.target.value)}
                placeholder="Aadhaar number"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <div className="space-y-2 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                  Profile picture
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPickProfilePicture}
                  className="w-full text-xs font-medium text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {profilePictureFile?.name ||
                    (existingProfilePhotoUrl
                      ? "Existing profile picture saved"
                      : "No profile picture")}
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                  Aadhaar photo
                </p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={onPickAadhaarCard}
                  className="w-full text-xs font-medium text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {aadhaarCardFile?.name ||
                    (existingAadhaarPhotoUrl
                      ? "Existing Aadhaar photo saved"
                      : "No Aadhaar photo")}
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                  Supporting documents
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={onPickSupportingFiles}
                  className="w-full text-xs font-medium text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
                />
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {supportingFiles.length > 0
                    ? `${supportingFiles.length} file(s) selected`
                    : `${existingSupportingDocuments.length} existing document(s)`}
                </p>
              </div>
              <input
                value={guardianName}
                onChange={(event) => setGuardianName(event.target.value)}
                placeholder="Guardian name"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={guardianRelationship}
                onChange={(event) =>
                  setGuardianRelationship(event.target.value)
                }
                placeholder="Guardian relationship"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <input
                value={guardianPhone}
                onChange={(event) => setGuardianPhone(event.target.value)}
                placeholder="Guardian phone"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              <textarea
                value={guardianAddress}
                onChange={(event) => setGuardianAddress(event.target.value)}
                placeholder="Guardian address"
                rows={3}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
              />
              {/* <input
              value={emergencyContactName}
              onChange={(event) => setEmergencyContactName(event.target.value)}
              placeholder="Emergency contact name"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            />
            <input
              value={emergencyContactPhone}
              onChange={(event) => setEmergencyContactPhone(event.target.value)}
              placeholder="Emergency contact phone"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50"
            /> */}
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
          ) : null}
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
                  <div className="flex items-start gap-3">
                    {tenant.profile_photo_url ? (
                      <Image
                        src={tenant.profile_photo_url}
                        alt={`${tenant.full_name || tenant.name || "Tenant"} profile`}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-14 w-14 shrink-0 rounded-full border border-zinc-300 object-cover dark:border-zinc-700"
                      />
                    ) : null}
                    <div className="flex w-full items-start justify-between gap-2">
                      <div className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                        <div>
                          {tenant.full_name || tenant.name || "Tenant"}{" "}
                          <span className="text-gray-500 text-sm">
                            {tenant.dob &&
                              calculateAge(
                                tenant.dob instanceof Date
                                  ? tenant.dob
                                  : tenant.dob.toDate?.() || new Date(),
                              )}
                          </span>
                          <div className="text-xs  text-gray-600 font-medium space-x-1">
                            <span className="font-semibold">
                              {tenant.gender === "male"
                                ? "Male"
                                : tenant.gender === "female"
                                  ? "Female"
                                  : "Other"}
                            </span>
                            <span>|</span>
                            <span className="">
                              S/O{" "}
                              <span className="capitalize">
                                {tenant.father_name?.toLowerCase() || "-"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-gray-600">
                        {getRefId(tenant.property_id) || "-"}
                      </span>
                    </div>

                    {/* <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    📞 {tenant.phone_number || "-"}
                  </p> */}
                  </div>

                  <ul className="mt-1">
                    <li className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      <span aria-hidden>🪪</span>
                      <span>{tenant.aadhaar_info?.number || "-"}</span>
                      <span>|</span>
                      <span>
                        {tenant.dob ? toDateInputValue(tenant.dob) : "-"}
                      </span>
                    </li>
                    <li className="mt-1 gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 ">
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 mr-1">
                        <span aria-hidden>🧑‍🤝‍🧑</span>
                        <span>{tenant.guardian_info?.name || "-"}</span>
                      </p>
                      <span>({tenant.guardian_info?.relationship || "-"})</span>
                      , <span>{tenant.guardian_info?.phone || "-"}</span>
                    </li>
                  </ul>
                  {/* <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <span aria-hidden>🎂</span>
                    <span>{toDateInputValue(tenant.dob) || "-"}</span>
                  </p> */}

                  <p className="mt-1 inline-flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span aria-hidden>📍</span>
                    <span>{tenant.guardian_info?.address || "-"}</span>
                  </p>
                  <div className="mt-2 rounded-lg border border-zinc-300 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 dark:text-zinc-400">
                      Documents
                    </p>
                    <div className="mt-1 space-y-1">
                      {tenant.aadhaar_info?.photo_url ? (
                        <div className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          <span>🪪 Aadhaar photo</span>
                          <div className="inline-flex items-center gap-2">
                            <a
                              href={tenant.aadhaar_info.photo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-900 underline dark:text-zinc-100"
                            >
                              View
                            </a>
                            <a
                              href={tenant.aadhaar_info.photo_url}
                              download
                              className="text-zinc-900 underline dark:text-zinc-100"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          No Aadhaar photo
                        </p>
                      )}
                      {(tenant.supporting_documents || []).map(
                        (document, index) => (
                          <div
                            key={`${document.url || document.name || "doc"}-${index}`}
                            className="flex items-center justify-between gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            <span className="truncate">
                              📎 {document.name || `Document ${index + 1}`}
                            </span>
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={document.url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-900 underline dark:text-zinc-100"
                              >
                                View
                              </a>
                              <a
                                href={document.url || "#"}
                                download={document.name || true}
                                className="text-zinc-900 underline dark:text-zinc-100"
                              >
                                Download
                              </a>
                            </div>
                          </div>
                        ),
                      )}
                      {(tenant.supporting_documents || []).length === 0 ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          No supporting documents
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {/* <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Emergency contact: {tenant.emergency_contact?.name || "-"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Emergency phone: {tenant.emergency_contact?.phone || "-"}
                  </p> */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${tenant.phone_number}`}
                      className="col-span-2 inline-flex p-3 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="mr-3">📞</span>
                      {tenant.phone_number}
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(true);
                        setEditingTenantUid(tenant.uid);
                        setFullName(tenant.full_name || tenant.name || "");
                        setPhoneNumber(tenant.phone_number || "");
                        setPropertyId(getRefId(tenant.property_id));
                        setIsPrimaryTenant(Boolean(tenant.is_primary_tenant));
                        setAddress(tenant.permanent_address || "");
                        setPincode(tenant.pincode || "");
                        setGender(tenant.gender || "");
                        setDob(toDateInputValue(tenant.dob));
                        setFatherName(tenant.father_name || "");
                        setAadhaarNumber(tenant.aadhaar_info?.number || "");
                        setGuardianName(tenant.guardian_info?.name || "");
                        setGuardianRelationship(
                          tenant.guardian_info?.relationship || "",
                        );
                        setGuardianPhone(tenant.guardian_info?.phone || "");
                        setGuardianAddress(tenant.guardian_info?.address || "");
                        setEmergencyContactName(
                          tenant.emergency_contact?.name || "",
                        );
                        setEmergencyContactPhone(
                          tenant.emergency_contact?.phone || "",
                        );
                        setExistingProfilePhotoUrl(
                          tenant.profile_photo_url || "",
                        );
                        setExistingProfilePhotoStoragePath(
                          tenant.profile_photo_storage_path || "",
                        );
                        setExistingAadhaarPhotoUrl(
                          tenant.aadhaar_info?.photo_url || "",
                        );
                        setExistingAadhaarPhotoStoragePath(
                          tenant.aadhaar_info?.photo_storage_path || "",
                        );
                        setExistingSupportingDocuments(
                          tenant.supporting_documents || [],
                        );
                        setProfilePictureFile(null);
                        setAadhaarCardFile(null);
                        setSupportingFiles([]);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-300 bg-white px-3 text-xs font-bold text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingUid === tenant.uid}
                      onClick={async () => {
                        const shouldDelete = window.confirm(
                          "Are you sure you want to delete this tenant?",
                        );
                        if (!shouldDelete) {
                          return;
                        }

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
