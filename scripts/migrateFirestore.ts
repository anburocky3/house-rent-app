import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin";

const usersSchema = {
  full_name: "",
  role: "admin",
  phone_number: "",
  fcmToken: "",
  permanent_address: "",
  property_id: db.doc("properties/PROPERTY_ID"),
  is_primary_tenant: false,
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
