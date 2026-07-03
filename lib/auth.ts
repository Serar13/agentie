import crypto from "crypto";
import { cookies } from "next/headers";
import { findUserById } from "@/services/firebase-store";

const SESSION_SECRET = process.env.SESSION_SECRET || "a-very-long-secret-key-of-32-characters-or-more-positive-news";
const ENCRYPTION_KEY = crypto.scryptSync(SESSION_SECRET, "salt-positive-news", 32);

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text: string): string | null {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift()!, "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch (e) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, "salt-positive-news-pwd", 1000, 64, "sha512").toString("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  const inputHash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(hash, "hex"));
}

export async function createSession(userId: string, role: string) {
  const sessionData = JSON.stringify({ userId, role, expires: Date.now() + 24 * 60 * 60 * 1000 });
  const encrypted = encrypt(sessionData);

  const cookieStore = await cookies();
  cookieStore.set("session", encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 // 1 day
  });
}

export async function getSession(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie || !sessionCookie.value) return null;

  const decrypted = decrypt(sessionCookie.value);
  if (!decrypted) return null;

  try {
    const data = JSON.parse(decrypted) as { userId: string; role: string; expires: number };
    if (data.expires < Date.now()) {
      return null;
    }
    return { userId: data.userId, role: data.role };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return findUserById(session.userId);
}
