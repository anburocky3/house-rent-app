"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useRoleGuard } from "../../_hooks/useRoleGuard";

type RefLike = { id?: string } | string;

export type TenantDocument = {
  name?: string;
  url?: string;
  storage_path?: string;
  content_type?: string;
  size_bytes?: number;
};

export type TenantSummary = {
  uid: string;
  full_name?: string;
  name?: string;
  profile_photo_url?: string;
  profile_photo_storage_path?: string;
  phone_number?: string;
  gender?: string;
  dob?: { toDate?: () => Date } | Date;
  father_name?: string;
  aadhaar_info?: {
    number?: string;
    last4?: string;
    photo_url?: string;
    photo_storage_path?: string;
  };
  guardian_info?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };
  emergency_contact?: {
    name?: string;
    phone?: string;
  };
  supporting_documents?: TenantDocument[];
  property_id?: RefLike;
  is_primary_tenant?: boolean;
  permanent_address?: string;
  pincode?: string;
  _deleted?: boolean;
};

export type ComplaintSummary = {
  id: string;
  status?: string;
  complaint_type?: string;
  title?: string;
  description?: string;
  property_id?: RefLike;
  created_at?: { toDate?: () => Date };
};

type PropertySummary = {
  id: string;
  owner_uid?: RefLike;
  property_id?: string;
  property_occupied_from?: { toDate?: () => Date } | Date;
  advance_paid?: number;
  ward_no?: string;
  street_name?: string;
  rent_amount?: number;
  water_charge?: number;
  electricity_rate?: number;
  terms_and_conditions?: string;
  schedule_of_property?: string;
  fitting_and_fixtures?: string;
  _deleted?: boolean;
};

export type BillingLedgerSummary = {
  id: string;
  property_id?: RefLike;
  month_year?: string;
  payment_status?: string;
  prev_meter_reading?: number;
  current_meter_reading?: number;
  electricity_total?: number;
  updated_at?: { toDate?: () => Date };
};

type UpdateTenantInput = {
  uid?: string;
  full_name: string;
  phone_number: string;
  propertyId: string;
  is_primary_tenant: boolean;
  permanent_address?: string;
  pincode?: string;
  gender?: string;
  dob?: string;
  father_name?: string;
  aadhaar_number?: string;
  guardian_name?: string;
  guardian_relationship?: string;
  guardian_phone?: string;
  guardian_address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  profile_picture_file?: File | null;
  aadhaar_card_file?: File | null;
  supporting_documents?: File[];
  existing_profile_photo_url?: string;
  existing_profile_photo_storage_path?: string;
  existing_aadhaar_photo_url?: string;
  existing_aadhaar_photo_storage_path?: string;
  existing_supporting_documents?: TenantDocument[];
};

type UpdateSettingsInput = {
  full_name: string;
  phone_number: string;
  upi_id: string;
  permanent_address: string;
  tenant_terms: string;
};

type UpdatePropertyChargesInput = {
  propertyId: string;
  rent_amount: number;
  water_charge: number;
  electricity_rate: number;
};

type CreatePropertyInput = {
  property_id: string;
  property_occupied_from?: string;
  advance_paid: number;
  ward_no?: string;
  street_name: string;
  rent_amount: number;
  water_charge: number;
  electricity_rate: number;
  terms_and_conditions?: string;
  schedule_of_property?: string;
  fitting_and_fixtures?: string;
};

type UpdatePropertyInput = {
  propertyId: string;
  property_occupied_from?: string;
  advance_paid: number;
  ward_no?: string;
  street_name: string;
  rent_amount: number;
  water_charge: number;
  electricity_rate: number;
  terms_and_conditions?: string;
  schedule_of_property?: string;
  fitting_and_fixtures?: string;
};

const getRefId = (value?: RefLike) => {
  if (!value) {
    return "";
  }
  if (typeof value === "string") {
    const segments = value.split("/").filter(Boolean);
    return segments[segments.length - 1] || "";
  }
  return value.id || "";
};

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);

const uploadTenantFile = async (
  propertyId: string,
  tenantUid: string,
  file: File,
  category: "profile" | "aadhaar" | "supporting",
) => {
  const safeName = sanitizeFileName(file.name || "file");
  const formData = new FormData();
  formData.append("file", file, safeName);
  formData.append("propertyId", propertyId);
  formData.append("tenantUid", tenantUid);
  formData.append("category", category);

  const response = await fetch("/api/tenant-documents/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload tenant document");
  }

  const uploaded = (await response.json()) as TenantDocument;
  return {
    name: uploaded.name || file.name,
    url: uploaded.url || "",
    storage_path: uploaded.storage_path || "",
    content_type: uploaded.content_type || file.type,
    size_bytes: uploaded.size_bytes ?? file.size,
  };
};

export function useAdminDashboardData() {
  const { isAllowed, isCheckingAccess, profile, uid } = useRoleGuard({
    role: "admin",
    redirectTo: "/login/super",
  });

  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [latestLedgerByProperty, setLatestLedgerByProperty] = useState<
    Record<string, BillingLedgerSummary>
  >({});
  const [isLoadingData, setIsLoadingData] = useState(false);

  const loadData = useCallback(async () => {
    if (!uid) {
      return;
    }

    const normalizedPhone = (
      (profile?.phone_number as string | undefined) || ""
    ).replace(/\D/g, "");

    setIsLoadingData(true);
    try {
      const [propertyDocs, tenantDocs, complaintDocs, ledgerDocs, adminDocs] =
        await Promise.all([
          getDocs(collection(db, "properties")),
          getDocs(
            query(collection(db, "users"), where("role", "==", "tenant")),
          ),
          getDocs(collection(db, "complaints")),
          getDocs(collection(db, "billing_ledger")),
          getDocs(query(collection(db, "users"), where("role", "==", "admin"))),
        ]);

      const ownerUidCandidates = new Set<string>([uid]);
      adminDocs.docs.forEach((adminDoc) => {
        const adminData = adminDoc.data() as { phone_number?: string };
        const adminPhone = (adminData.phone_number || "").replace(/\D/g, "");
        if (normalizedPhone && adminPhone === normalizedPhone) {
          ownerUidCandidates.add(adminDoc.id);
        }
      });

      const ownerProperties = propertyDocs.docs
        .map((propertyDoc) => ({
          id: propertyDoc.id,
          ...(propertyDoc.data() as Omit<PropertySummary, "id">),
        }))
        .filter(
          (property) =>
            property._deleted !== true &&
            ownerUidCandidates.has(getRefId(property.owner_uid)),
        );

      const ownedPropertyIds = new Set(ownerProperties.map((item) => item.id));

      const nextTenants = tenantDocs.docs
        .map((tenantDoc) => ({
          uid: tenantDoc.id,
          ...(tenantDoc.data() as Omit<TenantSummary, "uid">),
        }))
        .filter((tenant) => {
          const tenantPropertyId = getRefId(tenant.property_id);
          return (
            tenant._deleted !== true &&
            Boolean(tenantPropertyId) &&
            ownedPropertyIds.has(tenantPropertyId)
          );
        })
        .sort((first, second) => {
          if (first.is_primary_tenant && !second.is_primary_tenant) {
            return -1;
          }
          if (!first.is_primary_tenant && second.is_primary_tenant) {
            return 1;
          }
          const firstName = (first.full_name || first.name || "").toLowerCase();
          const secondName = (
            second.full_name ||
            second.name ||
            ""
          ).toLowerCase();
          return firstName.localeCompare(secondName);
        });

      const nextComplaints = complaintDocs.docs
        .map((complaintDoc) => ({
          id: complaintDoc.id,
          ...(complaintDoc.data() as Omit<ComplaintSummary, "id">),
        }))
        .filter((item) => {
          const complaintPropertyId = getRefId(item.property_id);
          return (
            Boolean(complaintPropertyId) &&
            ownedPropertyIds.has(complaintPropertyId)
          );
        })
        .sort((first, second) => {
          const firstDate = first.created_at?.toDate?.()?.getTime() || 0;
          const secondDate = second.created_at?.toDate?.()?.getTime() || 0;
          return secondDate - firstDate;
        });

      const ledgers = ledgerDocs.docs
        .map((ledgerDoc) => ({
          id: ledgerDoc.id,
          ...(ledgerDoc.data() as Omit<BillingLedgerSummary, "id">),
        }))
        .filter((item) => {
          const ledgerPropertyId = getRefId(item.property_id);
          return (
            Boolean(ledgerPropertyId) && ownedPropertyIds.has(ledgerPropertyId)
          );
        });

      const nextLatestLedgerByProperty = ledgers.reduce<
        Record<string, BillingLedgerSummary>
      >((accumulator, ledger) => {
        const propertyId = getRefId(ledger.property_id);
        if (!propertyId) {
          return accumulator;
        }

        const existing = accumulator[propertyId];
        if (!existing) {
          accumulator[propertyId] = ledger;
          return accumulator;
        }

        const existingTime = existing.updated_at?.toDate?.()?.getTime() || 0;
        const currentTime = ledger.updated_at?.toDate?.()?.getTime() || 0;
        if (currentTime >= existingTime) {
          accumulator[propertyId] = ledger;
        }

        return accumulator;
      }, {});

      setProperties(ownerProperties);
      setTenants(nextTenants);
      setComplaints(nextComplaints);
      setLatestLedgerByProperty(nextLatestLedgerByProperty);
    } finally {
      setIsLoadingData(false);
    }
  }, [uid, profile]);

  useEffect(() => {
    if (!isAllowed || isCheckingAccess || !uid) {
      return;
    }
    void loadData();
  }, [isAllowed, isCheckingAccess, uid, loadData]);

  const updateElectricityUnits = async (
    ledgerId: string,
    nextCurrentUnit: number,
  ) => {
    const ledgerRef = doc(db, "billing_ledger", ledgerId);
    const snapshot = await getDoc(ledgerRef);
    if (!snapshot.exists()) {
      return;
    }

    const ledger = snapshot.data() as BillingLedgerSummary;
    const propertyId = getRefId(ledger.property_id);
    if (!propertyId) {
      return;
    }

    const property = properties.find((item) => item.id === propertyId);
    const prev = ledger.prev_meter_reading ?? 0;
    const unitRate = property?.electricity_rate ?? 0;
    const consumedUnits = Math.max(nextCurrentUnit - prev, 0);

    await updateDoc(ledgerRef, {
      current_meter_reading: nextCurrentUnit,
      electricity_total: consumedUnits * unitRate,
      updated_at: serverTimestamp(),
    });

    await loadData();
  };

  const updatePropertyCharges = async (input: UpdatePropertyChargesInput) => {
    await setDoc(
      doc(db, "properties", input.propertyId),
      {
        rent_amount: input.rent_amount,
        water_charge: input.water_charge,
        electricity_rate: input.electricity_rate,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    await loadData();
  };

  const createProperty = async (input: CreatePropertyInput) => {
    if (!uid || !input.property_id.trim()) {
      return;
    }

    const propertyId = input.property_id.trim();
    await setDoc(
      doc(db, "properties", propertyId),
      {
        property_id: propertyId,
        owner_uid: doc(db, "users", uid),
        property_occupied_from: input.property_occupied_from
          ? new Date(`${input.property_occupied_from}T00:00:00`)
          : null,
        advance_paid: input.advance_paid,
        ward_no: input.ward_no?.trim() || "",
        street_name: input.street_name.trim(),
        rent_amount: input.rent_amount,
        water_charge: input.water_charge,
        electricity_rate: input.electricity_rate,
        terms_and_conditions: input.terms_and_conditions?.trim() || "",
        schedule_of_property: input.schedule_of_property?.trim() || "",
        fitting_and_fixtures: input.fitting_and_fixtures?.trim() || "",
        _deleted: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    await loadData();
  };

  const updateProperty = async (input: UpdatePropertyInput) => {
    await setDoc(
      doc(db, "properties", input.propertyId),
      {
        property_id: input.propertyId,
        property_occupied_from: input.property_occupied_from
          ? new Date(`${input.property_occupied_from}T00:00:00`)
          : null,
        advance_paid: input.advance_paid,
        ward_no: input.ward_no?.trim() || "",
        street_name: input.street_name.trim(),
        rent_amount: input.rent_amount,
        water_charge: input.water_charge,
        electricity_rate: input.electricity_rate,
        terms_and_conditions: input.terms_and_conditions?.trim() || "",
        schedule_of_property: input.schedule_of_property?.trim() || "",
        fitting_and_fixtures: input.fitting_and_fixtures?.trim() || "",
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    await loadData();
  };

  const deleteProperty = async (propertyId: string) => {
    await setDoc(
      doc(db, "properties", propertyId),
      {
        _deleted: true,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    await loadData();
  };

  const updatePropertyCurrentUnits = async (
    propertyId: string,
    nextCurrentUnit: number,
  ) => {
    const property = properties.find((item) => item.id === propertyId);
    const unitRate = property?.electricity_rate ?? 0;
    const latestLedger = latestLedgerByProperty[propertyId];

    if (latestLedger?.id) {
      const prev = latestLedger.prev_meter_reading ?? 0;
      const consumedUnits = Math.max(nextCurrentUnit - prev, 0);

      await updateDoc(doc(db, "billing_ledger", latestLedger.id), {
        current_meter_reading: nextCurrentUnit,
        electricity_total: consumedUnits * unitRate,
        updated_at: serverTimestamp(),
      });
      await loadData();
      return;
    }

    const now = new Date();
    const monthYear = now.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    await addDoc(collection(db, "billing_ledger"), {
      property_id: doc(db, "properties", propertyId),
      month_year: monthYear,
      prev_meter_reading: 0,
      current_meter_reading: nextCurrentUnit,
      electricity_total: nextCurrentUnit * unitRate,
      payment_status: "pending",
      paid_at: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await loadData();
  };

  const saveTenant = async (input: UpdateTenantInput) => {
    if (
      !input.full_name.trim() ||
      !input.phone_number.trim() ||
      !input.propertyId
    ) {
      return;
    }

    const tenantRef = input.uid
      ? doc(db, "users", input.uid)
      : doc(collection(db, "users"));

    let profilePhotoUrl = input.existing_profile_photo_url?.trim() || "";
    let profilePhotoStoragePath =
      input.existing_profile_photo_storage_path?.trim() || "";

    if (input.profile_picture_file) {
      const uploadedProfile = await uploadTenantFile(
        input.propertyId,
        tenantRef.id,
        input.profile_picture_file,
        "profile",
      );
      profilePhotoUrl = uploadedProfile.url || "";
      profilePhotoStoragePath = uploadedProfile.storage_path || "";
    }

    let aadhaarPhotoUrl = input.existing_aadhaar_photo_url?.trim() || "";
    let aadhaarPhotoStoragePath =
      input.existing_aadhaar_photo_storage_path?.trim() || "";

    if (input.aadhaar_card_file) {
      const uploadedAadhaar = await uploadTenantFile(
        input.propertyId,
        tenantRef.id,
        input.aadhaar_card_file,
        "aadhaar",
      );
      aadhaarPhotoUrl = uploadedAadhaar.url || "";
      aadhaarPhotoStoragePath = uploadedAadhaar.storage_path || "";
    }

    const existingDocuments = input.existing_supporting_documents || [];
    const uploadedSupportingDocuments = await Promise.all(
      (input.supporting_documents || []).map((file) =>
        uploadTenantFile(input.propertyId, tenantRef.id, file, "supporting"),
      ),
    );

    const mergedSupportingDocsByName = new Map<string, TenantDocument>();
    for (const existingDocument of existingDocuments) {
      const key = sanitizeFileName(existingDocument.name || "").toLowerCase();
      if (!key) {
        continue;
      }
      mergedSupportingDocsByName.set(key, existingDocument);
    }
    for (const uploadedDocument of uploadedSupportingDocuments) {
      const key = sanitizeFileName(uploadedDocument.name || "").toLowerCase();
      if (!key) {
        continue;
      }
      mergedSupportingDocsByName.set(key, uploadedDocument);
    }

    const payload = {
      full_name: input.full_name.trim(),
      profile_photo_url: profilePhotoUrl,
      profile_photo_storage_path: profilePhotoStoragePath,
      phone_number: input.phone_number.trim().replace(/\D/g, ""),
      role: "tenant",
      property_id: doc(db, "properties", input.propertyId),
      is_primary_tenant: input.is_primary_tenant,
      permanent_address: input.permanent_address?.trim() || "",
      pincode: input.pincode?.trim() || "",
      gender: input.gender?.trim() || "",
      dob: input.dob ? new Date(`${input.dob}T00:00:00`) : null,
      father_name: input.father_name?.trim() || "",
      aadhaar_info: {
        number: input.aadhaar_number?.trim().replace(/\D/g, "") || "",
        last4: (input.aadhaar_number?.trim().replace(/\D/g, "") || "").slice(
          -4,
        ),
        photo_url: aadhaarPhotoUrl,
        photo_storage_path: aadhaarPhotoStoragePath,
      },
      guardian_info: {
        name: input.guardian_name?.trim() || "",
        relationship: input.guardian_relationship?.trim() || "",
        phone: input.guardian_phone?.trim().replace(/\D/g, "") || "",
        address: input.guardian_address?.trim() || "",
      },
      emergency_contact: {
        name: input.emergency_contact_name?.trim() || "",
        phone: input.emergency_contact_phone?.trim().replace(/\D/g, "") || "",
      },
      supporting_documents: Array.from(mergedSupportingDocsByName.values()),
      _deleted: false,
      updated_at: serverTimestamp(),
    };

    if (input.uid) {
      await setDoc(tenantRef, payload, { merge: true });
    } else {
      await setDoc(tenantRef, {
        ...payload,
        created_at: serverTimestamp(),
      });
    }

    await loadData();
  };

  const deleteTenant = async (tenantUid: string) => {
    await setDoc(
      doc(db, "users", tenantUid),
      {
        _deleted: true,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    await loadData();
  };

  const updateComplaintStatus = async (complaintId: string, status: string) => {
    await updateDoc(doc(db, "complaints", complaintId), {
      status,
      resolved_at: status === "Resolved" ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    });
    await loadData();
  };

  const updateSettings = async (input: UpdateSettingsInput) => {
    if (!uid) {
      return;
    }

    await setDoc(
      doc(db, "users", uid),
      {
        full_name: input.full_name.trim(),
        phone_number: input.phone_number.trim().replace(/\D/g, ""),
        upi_id: input.upi_id.trim(),
        permanent_address: input.permanent_address.trim(),
        tenant_terms: input.tenant_terms.trim(),
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );

    await loadData();
  };

  const adminName =
    (profile?.full_name as string | undefined) ||
    (profile?.name as string | undefined) ||
    "Owner";

  const openComplaintsCount = useMemo(
    () => complaints.filter((item) => item.status !== "resolved").length,
    [complaints],
  );

  return {
    isAllowed,
    isCheckingAccess,
    isLoadingData,
    reloadData: loadData,
    adminName,
    adminProfile: profile,
    properties,
    tenants,
    complaints,
    latestLedgerByProperty,
    openComplaintsCount,
    updateElectricityUnits,
    createProperty,
    updateProperty,
    deleteProperty,
    updatePropertyCharges,
    updatePropertyCurrentUnits,
    saveTenant,
    deleteTenant,
    updateComplaintStatus,
    updateSettings,
  };
}
