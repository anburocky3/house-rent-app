import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin";
import type { Role, UserProfile } from "@/types";

type SeedUser = {
  uid: string;
  full_name: string;
  role: Role;
  phone_number: string;
  upi_id?: string;
  permanent_address: string;
  pincode: string;
  is_primary_tenant?: boolean;
  gender?: string;
  dob?: Timestamp;
  father_name?: string;
  aadhaar_info?: {
    number: string;
    last4: string;
  };
  guardian_info?: {
    name: string;
    relationship: string;
    phone: string;
    address: string;
  };
};

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");
const tenantEnteredDate = Timestamp.fromDate(
  new Date("2026-02-03T00:00:00+05:30"),
);
const propertyOccupiedFromDate = Timestamp.fromDate(
  new Date("2026-02-03T00:00:00+05:30"),
);

const seed = async () => {
  const users: SeedUser[] = [
    {
      uid: "owner_demo",
      full_name: "John Doe",
      role: "admin",
      phone_number: "+91 9000000001",
      upi_id: "ownerdemo@okhdfcbank",
      permanent_address: "123 Main Street, City Name",
      pincode: "600071",
    },
    {
      uid: "tenant_demo_1",
      full_name: "Tenant One",
      role: "tenant",
      phone_number: "+91 9000000002",
      permanent_address: "Flat A, 123 Main Street, City Name",
      is_primary_tenant: true,
      pincode: "600071",
      gender: "male",
      dob: Timestamp.fromDate(new Date("1995-06-12T00:00:00+05:30")),
      father_name: "Dhanapal",
      aadhaar_info: {
        number: "567812341234",
        last4: "1234",
      },
      guardian_info: {
        name: "Meena D",
        relationship: "Mother",
        phone: "9000000101",
        address: "123 Main Street, City Name",
      },
    },
    {
      uid: "tenant_demo_2",
      full_name: "Tenant Two",
      role: "tenant",
      phone_number: "+91 9000000003",
      permanent_address: "Flat A, 123 Main Street, City Name",
      is_primary_tenant: false,
      pincode: "600071",
      gender: "female",
      dob: Timestamp.fromDate(new Date("1997-01-20T00:00:00+05:30")),
      father_name: "Kannan",
      aadhaar_info: {
        number: "678923451234",
        last4: "1234",
      },
      guardian_info: {
        name: "Priya K",
        relationship: "Sister",
        phone: "9000000102",
        address: "123 Main Street, City Name",
      },
    },
    {
      uid: "tenant_demo_3",
      full_name: "Tenant Three",
      role: "tenant",
      phone_number: "+91 9000000004",
      permanent_address: "Flat A, 123 Main Street, City Name",
      is_primary_tenant: false,
      pincode: "600071",
      gender: "male",
      dob: Timestamp.fromDate(new Date("1999-09-08T00:00:00+05:30")),
      father_name: "Sekar",
      aadhaar_info: {
        number: "789034561234",
        last4: "1234",
      },
      guardian_info: {
        name: "Ravi S",
        relationship: "Father",
        phone: "9000000103",
        address: "123 Main Street, City Name",
      },
    },
  ];

  // Create property first
  const ownerUid = users.find((user) => user.role === "admin")?.uid ?? "";

  await db
    .collection("properties")
    .doc("avadi_house_01")
    .set(
      {
        property_id: "avadi_house_01",
        owner_uid: db.doc(`users/${ownerUid}`),
        property_occupied_from: propertyOccupiedFromDate,
        rent_amount: 7000,
        water_charge: 200,
        electricity_rate: 6,
        advance_paid: 15000,
        ward_no: "",
        street_name: "Second Street, Ramalingapuram",
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  // Create users with property_id for tenants
  for (const user of users) {
    const userData: UserProfile = {
      full_name: user.full_name,
      role: user.role,
      phone_number: normalizePhone(user.phone_number),
      upi_id: user.upi_id ?? "",
      fcmToken: "",
      permanent_address: user.permanent_address,
      pincode: user.pincode,
      emergency_contact: {
        name: "",
        phone: "",
      },
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    };

    // Add property_id and is_primary_tenant for tenants
    if (user.role === "tenant") {
      userData.property_id = db.doc("properties/avadi_house_01");
      userData.is_primary_tenant = user.is_primary_tenant ?? false;
      userData.tenant_entered = tenantEnteredDate;
      userData.gender = user.gender ?? "";
      userData.dob = user.dob ?? null;
      userData.father_name = user.father_name ?? "";
      userData.aadhaar_info = user.aadhaar_info ?? { number: "", last4: "" };
      userData.guardian_info =
        user.guardian_info ??
        ({
          name: "",
          relationship: "",
          phone: "",
          address: "",
        } as const);
    }

    await db.collection("users").doc(user.uid).set(userData, { merge: true });
  }

  const tenantUids = users
    .filter((user) => user.role === "tenant")
    .map((user) => user.uid);

  await db
    .collection("billing_ledger")
    .doc("2026_02_ledger")
    .set(
      {
        billing_id: "2026_02_ledger",
        property_id: db.doc("properties/avadi_house_01"),
        month_year: "February 2026",
        prev_meter_reading: 0,
        current_meter_reading: 0,
        electricity_total: 0,
        net_total: 0,
        payment_status: "pending",
        paid_at: null,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  await db
    .collection("house_inspections")
    .doc("inspection_demo_01")
    .set(
      {
        uploaded_by: db.doc(`users/${ownerUid}`),
        timestamp: FieldValue.serverTimestamp(),
        photo_urls: [""],
        status: "Clean",
        admin_remarks: "",
      },
      { merge: true },
    );

  await db
    .collection("complaints")
    .doc("complaint_demo_01")
    .set(
      {
        created_by: db.doc(`users/${tenantUids[0]}`),
        property_id: db.doc("properties/avadi_house_01"),
        title: "Water pressure issue",
        description: "Low pressure in the kitchen tap.",
        status: "Open",
        priority: "Medium",
        attachments: [""],
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
        resolved_at: null,
      },
      { merge: true },
    );

  console.log("Seed completed.");
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});
