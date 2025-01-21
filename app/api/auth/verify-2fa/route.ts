// app/api/auth/verify-2fa/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authenticator } from "otplib";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = await getToken({ req });

    if (!token?.id) {
      console.log("No token found");

      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { code, method } = body;

    if (!code || !method) {
      return NextResponse.json(
        { error: "Code et méthode requis" },
        { status: 400 },
      );
    }

    // Récupérer l'utilisateur et son secret
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    });

    if (!user || !user.twoFASecret) {
      return NextResponse.json(
        { error: "Configuration 2FA invalide" },
        { status: 400 },
      );
    }

    if (method === "authenticator") {
      try {
        // Vérifier le code TOTP
        const isValid = authenticator.verify({
          token: code.toString(),
          secret: user.twoFASecret,
        });

        if (!isValid) {
          return NextResponse.json({ error: "Code invalide" }, { status: 400 });
        }
        console.log(token.exp);
        const expirationDate = new Date(token.exp * 1000);

        // Mettre à jour le token de session avec is2FAVerified = true
        const updatedToken = {
          ...token,
          is2FAVerified: true,
        };

        await prisma.user.update({
          where: { id: token.id as string },
          data: { is2FAVerified: true, lastVerified: expirationDate },
        });
        // Stocker le token mis à jour dans la réponse

        return null;
      } catch (error) {
        console.error("TOTP verification error:", error);

        return NextResponse.json(
          { error: "Erreur de vérification TOTP" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Méthode non supportée" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Verify 2FA Error:", error);

    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 },
    );
  }
}
