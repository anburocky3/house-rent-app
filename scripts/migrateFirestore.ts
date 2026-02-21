import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin";

const usersSchema = {
  full_name: "",
  role: "admin",
  phone_number: "",
  upi_id: "",
  fcmToken: "",
  permanent_address: "",
  property_id: db.doc("properties/PROPERTY_ID"),
  is_primary_tenant: false,
  tenant_entered: new Date("2026-02-03T00:00:00+05:30"),
  gender: "",
  dob: new Date("1995-01-01T00:00:00+05:30"),
  father_name: "",
  aadhaar_info: {
    number: "",
    last4: "",
  },
  guardian_info: {
    name: "",
    relationship: "",
    phone: "",
    address: "",
  },
  pincode: "600071",
  emergency_contact: {
    name: "",
    phone: "",
  },
  created_at: FieldValue.serverTimestamp(),
  updated_at: FieldValue.serverTimestamp(),
};

const propertiesSchema = {
  property_id: "avadi_house_01",
  owner_uid: db.doc("users/OWNER_UID"),
  property_occupied_from: new Date("2026-02-03T00:00:00+05:30"),
  rent_amount: 7000,
  water_charge: 200,
  electricity_rate: 6,
  advance_paid: 15000,
  ward_no: "",
  street_name: "Second Street, Ramalingapuram",
  created_at: FieldValue.serverTimestamp(),
  updated_at: FieldValue.serverTimestamp(),
};

const billingLedgerSchema = {
  billing_id: "2026_02_ledger",
  property_id: db.doc("properties/PROPERTY_ID"),
  month_year: "February 2026",
  prev_meter_reading: 0,
  current_meter_reading: 0,
  electricity_total: 0,
  net_total: 0,
  payment_status: "pending",
  paid_at: null,
  created_at: FieldValue.serverTimestamp(),
  updated_at: FieldValue.serverTimestamp(),
};

const inspectionsSchema = {
  uploaded_by: db.doc("users/UPLOADER_UID"),
  timestamp: FieldValue.serverTimestamp(),
  photo_urls: [""],
  status: "Clean",
  admin_remarks: "",
};

const complaintsSchema = {
  created_by: db.doc("users/COMPLAINANT_UID"),
  property_id: db.doc("properties/avadi_house_01"),
  title: "",
  description: "",
  status: "Open",
  priority: "Medium",
  attachments: [""],
  created_at: FieldValue.serverTimestamp(),
  updated_at: FieldValue.serverTimestamp(),
  resolved_at: null,
};

const run = async () => {
  await db.collection("users").doc("_schema").set(usersSchema, {
    merge: true,
  });
  await db.collection("properties").doc("_schema").set(propertiesSchema, {
    merge: true,
  });
  await db
    .collection("billing_ledger")
    .doc("_schema")
    .set(billingLedgerSchema, {
      merge: true,
    });
  await db
    .collection("house_inspections")
    .doc("_schema")
    .set(inspectionsSchema, {
      merge: true,
    });
  await db.collection("complaints").doc("_schema").set(complaintsSchema, {
    merge: true,
  });

  console.log("Firestore migration completed.");
};

run().catch((error) => {
  console.error("Firestore migration failed:", error);
  process.exitCode = 1;
});
