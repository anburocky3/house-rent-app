import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import type { ServiceAccount } from "firebase-admin/app";

const getServiceAccount = (): ServiceAccount => {
  const fromJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (fromJson) {
    return JSON.parse(fromJson) as ServiceAccount;
  }

  const fromPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (fromPath) {
    return JSON.parse(readFileSync(fromPath, "utf8")) as ServiceAccount;
  }

  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH.",
  );
};

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert(getServiceAccount()),
  });

export const adminDb = getFirestore(app);
export const adminMessaging = getMessaging(app);
