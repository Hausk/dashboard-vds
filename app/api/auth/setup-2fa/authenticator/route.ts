// /app/api/auth/setup-2fa/authenticator/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const token = await getToken({ req });

    if (!token?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Générer le secret TOTP
    const secret = authenticator.generateSecret();

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier si le secret est déjà configuré
    if (user.twoFASecret) {
      return NextResponse.json(
        { error: "2FA déjà configurée" },
        { status: 400 },
      );
    }

    // Générer l'URL TOTP
    const otpauthUrl = authenticator.keyuri(
      user.email,
      "Libre & Vivant",
      secret,
    );

    // Générer le QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Mettre à jour l'utilisateur avec le secret
    await prisma.user.update({
      where: { id: token.id as string },
      data: {
        twoFASecret: secret,
        twoFAMethod: "authenticator",
      },
    });

    return NextResponse.json({
      qrCodeUrl,
      secret,
    });
  } catch (error) {
    console.error("Setup 2FA Error:", error);

    return NextResponse.json(
      { error: "Erreur lors de la configuration de l'authentificateur" },
      { status: 500 },
    );
  }
}
