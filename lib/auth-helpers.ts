import { getSession } from "./auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function getRequiredAdmin() {
  const session = await getRequiredSession();
  if (session.role !== "admin") {
    redirect("/cont");
  }
  return session;
}
