"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { usesFirebaseData } from "../data-provider";
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

  const existingUser = usesFirebaseData()
    ? await findUserByEmail(email)
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.findUnique({ where: { email } });
      })();

  if (existingUser) {
    redirect("/register?error=Acest email este deja inregistrat.");
  }

  const count = usesFirebaseData()
    ? await countUsers()
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.count();
      })();
  const role = count === 0 ? "admin" : "reader"; // Primul user devine admin automat!

  const passwordHash = hashPassword(password);

  const user = usesFirebaseData()
    ? await createUser({ email, passwordHash, name: name || null, location: location || null, role })
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.create({
          data: {
            email,
            passwordHash,
            name: name || null,
            location: location || null,
            role
          }
        });
      })();

  await createSession(user.id, user.role);

  redirect("/cont");
}

export async function loginAction(formData: FormData) {
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");

  if (!email || !password) {
    redirect("/login?error=Emailul si parola sunt obligatorii.");
  }

  const user = usesFirebaseData()
    ? await findUserByEmail(email)
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.findUnique({ where: { email } });
      })();

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

  const user = usesFirebaseData()
    ? await findUserById(session.userId)
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.findUnique({ where: { id: session.userId } });
      })();

  if (!user) return { error: "Utilizator inexistent." };

  let saved = user.savedArticles ? user.savedArticles.split(",").filter(Boolean) : [];
  const index = saved.indexOf(articleId);

  if (index >= 0) {
    saved.splice(index, 1);
  } else {
    saved.push(articleId);
  }

  if (usesFirebaseData()) {
    await updateUser(user.id, { savedArticles: saved.join(",") });
  } else {
    const { prisma } = await import("../prisma");
    await prisma.user.update({
      where: { id: user.id },
      data: { savedArticles: saved.join(",") }
    });
  }

  revalidatePath("/");
  revalidatePath(`/articles/[slug]`, "layout");
  revalidatePath("/cont");
  return { success: true, saved: index < 0 };
}

export async function toggleFollowCategoryAction(categorySlug: string) {
  const session = await getSession();
  if (!session) return { error: "Trebuie sa fii autentificat." };

  const user = usesFirebaseData()
    ? await findUserById(session.userId)
    : await (async () => {
        const { prisma } = await import("../prisma");
        return prisma.user.findUnique({ where: { id: session.userId } });
      })();

  if (!user) return { error: "Utilizator inexistent." };

  let followed = user.followedCategories ? user.followedCategories.split(",").filter(Boolean) : [];
  const index = followed.indexOf(categorySlug);

  if (index >= 0) {
    followed.splice(index, 1);
  } else {
    followed.push(categorySlug);
  }

  if (usesFirebaseData()) {
    await updateUser(user.id, { followedCategories: followed.join(",") });
  } else {
    const { prisma } = await import("../prisma");
    await prisma.user.update({
      where: { id: user.id },
      data: { followedCategories: followed.join(",") }
    });
  }

  revalidatePath("/");
  revalidatePath("/cont");
  return { success: true, followed: index < 0 };
}
