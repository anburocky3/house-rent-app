import { db } from "./firebaseAdmin";

const collections = [
  "users",
  "properties",
  "billing_ledger",
  "house_inspections",
  "complaints",
];

const deleteCollection = async (collectionName: string) => {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    console.log(`Collection '${collectionName}' is already empty.`);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Deleted ${snapshot.size} documents from '${collectionName}'.`);
};

const run = async () => {
  console.log("Clearing all Firestore collections...\n");

  for (const collectionName of collections) {
    await deleteCollection(collectionName);
  }

  console.log("\n✓ All collections cleared successfully.");
};

run().catch((error) => {
  console.error("Clear collections failed:", error);
  process.exitCode = 1;
});
