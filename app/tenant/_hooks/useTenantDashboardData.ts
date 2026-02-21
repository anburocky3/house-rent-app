"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export type TenantProfile = {
  uid?: string;
  role?: string;
  full_name?: string;
  name?: string;
  phone_number?: string;
  permanent_address?: string;
  pincode?: string;
  gender?: string;
  dob?: { toDate?: () => Date };
  father_name?: string;
  aadhaar_info?: {
    number?: string;
    last4?: string;
  };
  guardian_info?: {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
  };
  terms_acceptance?: {
    accepted?: boolean;
    accepted_at?: { toDate?: () => Date };
    version?: string;
  };
  is_primary_tenant?: boolean;
  created_at?: { toDate?: () => Date };
  tenant_entered?: { toDate?: () => Date };
  property_id?: { id?: string };
  _deleted?: boolean;
};

export type PropertyDetails = {
  rent_amount?: number;
  water_charge?: number;
  electricity_rate?: number;
  property_id?: string;
  street_name?: string;
  owner_uid?: { id?: string };
  property_occupied_from?: { toDate?: () => Date };
};

export type BillingLedger = {
  month_year?: string;
  payment_status?: string;
  prev_meter_reading?: number;
  current_meter_reading?: number;
  electricity_total?: number;
  paid_at?: { toDate?: () => Date } | null;
  updated_at?: { toDate?: () => Date };
};

export type OwnerProfile = {
  full_name?: string;
  phone_number?: string;
  upi_id?: string;
  emergency_contact?: {
    name?: string;
    phone?: string;
  };
  permanent_address?: string;
};

export function useTenantDashboardData() {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [tenantName, setTenantName] = useState("Tenant");
  const [tenantUid, setTenantUid] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);
  const [ledgers, setLedgers] = useState<BillingLedger[]>([]);
  const [pendingLedger, setPendingLedger] = useState<BillingLedger | null>(
    null,
  );
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) {
        return;
      }

      if (!user) {
        router.replace("/login");
        setIsCheckingAccess(false);
        return;
      }

      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          router.replace("/login");
          return;
        }

        const profile = profileSnap.data() as TenantProfile;
        if (profile.role !== "tenant") {
          router.replace("/login");
          return;
        }

        const propertyRef = profile.property_id;
        if (!propertyRef?.id) {
          router.replace("/login");
          return;
        }

        const propertyRefPath = doc(db, "properties", propertyRef.id);

        const [propertySnap, ledgerSnap, tenantSnap] = await Promise.all([
          getDoc(propertyRefPath),
          getDocs(
            query(
              collection(db, "billing_ledger"),
              where("property_id", "==", propertyRefPath),
            ),
          ),
          getDocs(
            query(
              collection(db, "users"),
              where("role", "==", "tenant"),
              where("property_id", "==", propertyRefPath),
            ),
          ),
        ]);

        if (!propertySnap.exists()) {
          router.replace("/login");
          return;
        }

        const property = propertySnap.data() as PropertyDetails;
        const ownerRef = property.owner_uid;
        const ownerSnap = ownerRef?.id
          ? await getDoc(doc(db, "users", ownerRef.id))
          : null;

        const allLedgers = ledgerSnap.docs.map(
          (item) => item.data() as BillingLedger,
        );
        const pending =
          allLedgers.find((item) => item.payment_status === "pending") || null;

        const tenantList = tenantSnap.docs
          .map((tenantDoc) => ({
            uid: tenantDoc.id,
            ...(tenantDoc.data() as TenantProfile),
          }))
          .filter((tenant) => tenant._deleted !== true)
          .sort((first, second) => {
            if (first.is_primary_tenant && !second.is_primary_tenant) {
              return -1;
            }
            if (!first.is_primary_tenant && second.is_primary_tenant) {
              return 1;
            }
            const firstName = (
              first.full_name ||
              first.name ||
              ""
            ).toLowerCase();
            const secondName = (
              second.full_name ||
              second.name ||
              ""
            ).toLowerCase();
            return firstName.localeCompare(secondName);
          });

        setPropertyId(propertyRef.id);
        setTenantUid(user.uid);
        setPropertyDetails(property);
        setLedgers(allLedgers);
        setPendingLedger(pending);
        setTenants(tenantList);
        setOwnerProfile(
          ownerSnap?.exists() ? (ownerSnap.data() as OwnerProfile) : null,
        );
        setTenantName(
          profile.full_name || profile.name || user.displayName || "Tenant",
        );
        setIsAllowed(true);
      } catch {
        router.replace("/login");
      } finally {
        if (active) {
          setIsCheckingAccess(false);
        }
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [router]);

  const formatINR = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const toTelHref = (phone?: string) => {
    if (!phone) {
      return "";
    }
    return `tel:${phone.replace(/\s+/g, "")}`;
  };

  return {
    isAllowed,
    isCheckingAccess,
    tenantName,
    tenantUid,
    propertyId,
    propertyDetails,
    ledgers,
    pendingLedger,
    tenants,
    ownerProfile,
    formatINR,
    toTelHref,
  };
}
