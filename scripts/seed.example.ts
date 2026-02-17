import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebaseAdmin";

const normalizePhone = (phone: string) => phone.replace(/\D/g, "");

const seed = async () => {
  const users = [
    {
      uid: "owner_demo",
      full_name: "John Doe",
      role: "admin",
      phone_number: "+91 9000000001",
      permanent_address: "123 Main Street, City Name",
    },
    {
      uid: "tenant_demo_1",
      full_name: "Tenant One",
      role: "tenant",
      phone_number: "+91 9000000002",
      permanent_address: "Flat A, 123 Main Street, City Name",
      is_primary_tenant: true,
    },
    {
      uid: "tenant_demo_2",
      full_name: "Tenant Two",
      role: "tenant",
      phone_number: "+91 9000000003",
      permanent_address: "Flat A, 123 Main Street, City Name",
      is_primary_tenant: false,
    },
    {
      uid: "tenant_demo_3",
      full_name: "Tenant Three",
      role: "tenant",
      phone_number: "+91 9000000004",
      permanent_address: "Flat A, 123 Main Street, City Name",
      is_primary_tenant: false,
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
    const userData: Record<string, unknown> = {
      full_name: user.full_name,
      role: user.role,
      phone_number: normalizePhone(user.phone_number),
      fcmToken: "",
      permanent_address: user.permanent_address,
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
    }

    await db
      .collection("users")
      .doc(user.uid)
      .set(userData, { merge: true });
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
