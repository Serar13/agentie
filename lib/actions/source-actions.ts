"use server";

import { revalidatePath } from "next/cache";
import { scanConfiguredSources } from "../../services/source-service";
import { getRequiredAdmin } from "../auth-helpers";
import { createSource, deleteSourceFirebase, updateSourceFirebase } from "@/services/firebase-store";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function addSource(formData: FormData) {
  await getRequiredAdmin();

  const name = getField(formData, "name");
  const url = getField(formData, "url");
  const categoryId = getField(formData, "categoryId") || null;
  const trustScore = Number(getField(formData, "trustScore") || 70);
  const blacklistKeywords = getField(formData, "blacklistKeywords");
  const whitelistKeywords = getField(formData, "whitelistKeywords");
  const notes = getField(formData, "notes") || null;

  if (!name || !url) {
    throw new Error("Numele si URL-ul sunt obligatorii.");
  }

  const data = {
      name,
      url,
      type: "rss",
      status: "active",
      categoryId,
      trustScore,
      blacklistKeywords,
      whitelistKeywords,
      notes
  };
  await createSource(data);

  revalidatePath("/admin/sources");
}

export async function updateSource(formData: FormData) {
  await getRequiredAdmin();

  const id = getField(formData, "id");
  const name = getField(formData, "name");
  const url = getField(formData, "url");
  const status = getField(formData, "status") || "active";
  const categoryId = getField(formData, "categoryId") || null;
  const trustScore = Number(getField(formData, "trustScore") || 70);
  const blacklistKeywords = getField(formData, "blacklistKeywords");
  const whitelistKeywords = getField(formData, "whitelistKeywords");
  const notes = getField(formData, "notes") || null;

  if (!id || !name || !url) {
    throw new Error("ID-ul, Numele si URL-ul sunt obligatorii.");
  }

  const data = {
      name,
      url,
      status,
      categoryId,
      trustScore,
      blacklistKeywords,
      whitelistKeywords,
      notes
  };
  await updateSourceFirebase(id, data);

  revalidatePath("/admin/sources");
}

export async function deleteSource(formData: FormData) {
  await getRequiredAdmin();

  const id = getField(formData, "id");
  if (!id) throw new Error("ID-ul este obligatoriu.");

  await deleteSourceFirebase(id);

  revalidatePath("/admin/sources");
}

export async function scanSourcesAction() {
  await getRequiredAdmin();

  await scanConfiguredSources();
  revalidatePath("/admin");
  revalidatePath("/admin/sources");
}
