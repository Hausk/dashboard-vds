// utils/2fa.ts
import { totp } from "otplib";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import qrcode from "qrcode";

const prisma = new PrismaClient();

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function setupAuthenticator(userId: string) {
  const secret = totp.generateSecret();
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("User not found");

  const otpauth = totp.generateURL({
    secret,
    label: user.email,
    issuer: "VotreApp",
  });

  const qrCodeUrl = await qrcode.toDataURL(otpauth);

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFASecret: secret,
      twoFAMethod: "authenticator",
      is2FAEnabled: true,
    },
  });

  return { qrCodeUrl, secret };
}

export async function verifyAuthenticatorToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user?.twoFASecret) return false;

  return totp.verify({
    token,
    secret: user.twoFASecret,
  });
}

export async function sendEmailVerificationCode(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) throw new Error("User not found");

  const token = Math.random().toString(36).substr(2, 6).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: user.email,
    subject: "Code de vérification",
    text: `Votre code de vérification est : ${token}`,
    html: `<p>Votre code de vérification est : <strong>${token}</strong></p>`,
  });

  return token;
}

export async function verifyEmailToken(userId: string, token: string) {
  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      userId,
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verificationToken) return false;

  await prisma.verificationToken.delete({
    where: { id: verificationToken.id },
  });

  return true;
}

export async function isTrustedIP(userId: string, ipAddress: string) {
  const trustedIP = await prisma.trustedIP.findUnique({
    where: {
      userId_ipAddress: {
        userId,
        ipAddress,
      },
    },
  });

  return !!trustedIP;
}

export async function addTrustedIP(userId: string, ipAddress: string) {
  await prisma.trustedIP.create({
    data: {
      userId,
      ipAddress,
    },
  });
}
