"use server";

import { getToken } from "next-auth/jwt";
import { authenticator } from "otplib";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function verify2FA(formData: FormData) {
  try {
    const cookieStore = cookies();
    const token = await getToken({ req: { cookies: cookieStore.getAll() } });

    if (!token) {
      console.log("No token found");
      throw new Error("Non autorisé");
    }

    const code = formData.get("code") as string;
    const method = formData.get("method") as string;

    if (!code || !method) {
      throw new Error("Code et méthode requis");
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    });

    if (!user || !user.twoFASecret) {
      throw new Error("Configuration 2FA invalide");
    }

    if (method === "authenticator") {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFASecret,
      });

      if (!isValid) {
        throw new Error("Code invalide");
      }

      await prisma.user.update({
        where: { id: token.id as string },
        data: { is2FAVerified: true, lastVerified: new Date() },
      });

      revalidatePath("/api/auth/session"); // ⚡ Forcer le cache à se mettre à jour côté client

      return { success: true };
    }

    throw new Error("Méthode non supportée");
  } catch (error) {
    console.error("Erreur de vérification 2FA:", error);
    throw error;
  }
}
