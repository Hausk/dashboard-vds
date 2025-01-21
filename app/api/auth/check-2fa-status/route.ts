// app/api/auth/check-2fa-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

import { isTrustedIP } from "@/utils/2fa";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });

    if (!token?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const requires2FA =
      user.is2FAEnabled && !(await isTrustedIP(user.id, ip as string));

    return NextResponse.json({
      is2FAEnabled: user.is2FAEnabled,
      requires2FA,
      twoFAMethod: user.twoFAMethod,
    });
  } catch (error) {
    console.error("Check 2FA status error:", error);

    return NextResponse.json(
      { error: "Erreur lors de la vérification du statut 2FA" },
      { status: 500 },
    );
  }
}
