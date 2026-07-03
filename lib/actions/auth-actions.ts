"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword, createSession, deleteSession, getSession } from "../auth";
import { countUsers, createUser, findUserByEmail, findUserById, updateUser } from "@/services/firebase-store";

function getField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function registerAction(formData: FormData) {
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");
  const name = getField(formData, "name");
  const location = getField(formData, "location");

  if (!email || !password) {
    redirect("/register?error=Emailul si parola sunt obligatorii.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    redirect("/register?error=Acest email este deja inregistrat.");
  }

  const count = await countUsers();
  const role = count === 0 ? "admin" : "reader"; // Primul user devine admin automat!

  const passwordHash = hashPassword(password);

  const user = await createUser({ email, passwordHash, name: name || null, location: location || null, role });

  await createSession(user.id, user.role);

  redirect("/cont");
}

export async function loginAction(formData: FormData) {
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");

  if (!email || !password) {
    redirect("/login?error=Emailul si parola sunt obligatorii.");
  }

  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=Email sau parola incorecta.");
  }

  await createSession(user.id, user.role);

  if (user.role === "admin") {
    redirect("/admin");
  } else {
    redirect("/cont");
  }
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}

export async function toggleSavedArticleAction(articleId: string) {
  const session = await getSession();
  if (!session) return { error: "Trebuie sa fii autentificat." };

  const user = await findUserById(session.userId);

  if (!user) return { error: "Utilizator inexistent." };

  let saved = user.savedArticles ? user.savedArticles.split(",").filter(Boolean) : [];
  const index = saved.indexOf(articleId);

  if (index >= 0) {
    saved.splice(index, 1);
  } else {
    saved.push(articleId);
  }

  await updateUser(user.id, { savedArticles: saved.join(",") });

  revalidatePath("/");
  revalidatePath(`/articles/[slug]`, "layout");
  revalidatePath("/cont");
  return { success: true, saved: index < 0 };
}

export async function toggleFollowCategoryAction(categorySlug: string) {
  const session = await getSession();
  if (!session) return { error: "Trebuie sa fii autentificat." };

  const user = await findUserById(session.userId);

  if (!user) return { error: "Utilizator inexistent." };

  let followed = user.followedCategories ? user.followedCategories.split(",").filter(Boolean) : [];
  const index = followed.indexOf(categorySlug);

  if (index >= 0) {
    followed.splice(index, 1);
  } else {
    followed.push(categorySlug);
  }

  await updateUser(user.id, { followedCategories: followed.join(",") });

  revalidatePath("/");
  revalidatePath("/cont");
  return { success: true, followed: index < 0 };
}
