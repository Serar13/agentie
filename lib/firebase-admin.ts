import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getCredential() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return applicationDefault();

  return cert(JSON.parse(raw));
}

export function getFirebaseDb() {
  const app =
    getApps()[0] ??
    initializeApp({
      credential: getCredential(),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT
    });

  return getFirestore(app);
}
