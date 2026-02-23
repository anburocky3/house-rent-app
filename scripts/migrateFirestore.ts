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
  property_nickname: "Ramalingapuram House",
  contact_person: {
    name: "Owner",
    phone: "9876543210",
  },
  before_handover_images: [
    "/AVD_RMLP/1.jpeg",
    "/AVD_RMLP/2.jpeg",
    "/AVD_RMLP/3.jpeg",
    "/AVD_RMLP/4.jpeg",
    "/AVD_RMLP/5.jpeg",
    "/AVD_RMLP/6.jpeg",
    "/AVD_RMLP/7.jpeg",
    "/AVD_RMLP/8.jpeg",
  ],
  owner_uid: db.doc("users/OWNER_UID"),
  property_occupied_from: new Date("2026-02-03T00:00:00+05:30"),
  advance_paid: 15000,
  ward_no: "",
  street_name: "Second Street, Ramalingapuram",
  rent_amount: 7000,
  water_charge: 200,
  electricity_rate: 6,
  terms_and_conditions: [
    {
      id: 1,
      title: "Rent",
      description: "₹7,000 per month, payable on or before 5th of every month.",
    },
    {
      id: 2,
      title: "Water charges",
      description: "₹200 fixed per month along with rent.",
    },
    {
      id: 3,
      title: "Electricity charges",
      description: "₹6 per unit as per sub-meter reading.",
    },
    {
      id: 4,
      title: "Deposit",
      description:
        "₹15,000 security deposit, refundable at vacating without interest after arrears/ damages adjustment.",
    },
    {
      id: 5,
      title: "Period",
      description: "11 months from agreement date.",
    },
    {
      id: 6,
      title: "Occupancy & use",
      description: "Residential only, maximum 3 bachelors, no subletting.",
    },
    {
      id: 7,
      title: "Inspection & keys",
      description:
        "Landlord/authorized representative may inspect at reasonable times.",
    },
    {
      id: 8,
      title: "Additions & alterations",
      description:
        "Not allowed without written landlord permission; no subletting.",
    },
    {
      id: 9,
      title: "Cleanliness & maintenance",
      description:
        "Keep premises clean and tenantable; interior repainting required while vacating; restoration cost can be deducted from deposit.",
    },
    {
      id: 10,
      title: "Default of rent",
      description:
        "If rent is unpaid for two consecutive months, landlord may evict without prior notice.",
    },
    {
      id: 11,
      title: "Renewal & increase",
      description:
        "For renewal after 11 months, rent increases by 5% by mutual agreement.",
    },
    {
      id: 12,
      title: "Arrears & damages",
      description:
        "Any arrears, breakages, or damages will be deducted from deposit.",
    },
    {
      id: 13,
      title: "Interior painting",
      description:
        "Return premises in freshly painted condition or equivalent painting and labor charges will be deducted from deposit.",
    },
    {
      id: 14,
      title: "Notice",
      description:
        "One month written advance notice required from either party for termination.",
    },
  ],
  schedule_of_property:
    "No. 32, Second Street, Ramalingapuram, Kamaraj Nagar, Avadi, Chennai - 600071.",
  fitting_and_fixtures: [
    {
      id: 1,
      title: "LED Tubelight",
      description: "3 Nos.",
    },
    {
      id: 2,
      title: "LED Bulb",
      description: "5 Nos.",
    },
    {
      id: 3,
      title: "Night Light Bulb",
      description: "2 Nos.",
    },
    {
      id: 4,
      title: "Exhaust Fan",
      description: "1 No.",
    },
    {
      id: 5,
      title: "Calling Bell",
      description: "1 No.",
    },
    {
      id: 6,
      title: "Interior Painting (Walls, Window, Doors, Grills)",
      description: "Freshly Painted",
    },
  ],
  _deleted: false,
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
