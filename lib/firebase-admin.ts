import { cert, getApps, initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function throwFriendlyDevError(originalError?: any) {
  throw new Error(
    "\n================================================================================\n" +
    "🔴 FIREBASE CREDENTIALS MISSING FOR LOCAL DEVELOPMENT\n\n" +
    "To run the positive news agency locally, choose one of these options:\n\n" +
    "1. USE LOCAL SQLITE / PRISMA FALLBACK (Recommended for simple dev):\n" +
    "   Set the following environment variable in your .env file:\n" +
    "   DATA_PROVIDER=\"sqlite\"\n\n" +
    "2. USE FIREBASE LOCAL EMULATOR:\n" +
    "   Set the following environment variable in your .env file:\n" +
    "   FIRESTORE_EMULATOR_HOST=\"127.0.0.1:8080\"\n" +
    "   (Ensure you run `firebase emulators:start` in another terminal)\n\n" +
    "3. USE REAL FIREBASE FIRESTORE:\n" +
    "   Download a Service Account Key (JSON) from the Firebase Console,\n" +
    "   and set it as:\n" +
    "   FIREBASE_SERVICE_ACCOUNT_JSON='{ ...your JSON contents... }'\n" +
    "   or set the path to the JSON file as:\n" +
    "   GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/service-account.json\"\n" +
    "================================================================================\n"
  );
}

function getCredential() {
  // 1. Check if Firestore Emulator is active
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
      clientEmail: "dummy@dummy.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3......\n-----END PRIVATE KEY-----\n"
    });
  }

  // 2. Check if raw JSON service account is provided in environment
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return cert(JSON.parse(raw));
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON. Please check your environment variables."
      );
    }
  }

  // 3. Fallback to applicationDefault in production or if GOOGLE_APPLICATION_CREDENTIALS env var is present
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.NODE_ENV === "production") {
    try {
      return applicationDefault();
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        throwFriendlyDevError(err);
      }
      throw err;
    }
  }

  // 4. In development, if nothing is set, throw a friendly error
  throwFriendlyDevError();
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

