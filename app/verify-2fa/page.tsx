// /app/verify-2fa/page.tsx
"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@heroui/button";
import { InputOtp } from "@heroui/input-otp";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";

import { verify2FA } from "@/app/actions/auth/verify-2fa";

export default function Verify2FA() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (remainingTime > 0) {
      const timer = setInterval(() => {
        setRemainingTime((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [remainingTime]);

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/setup-2fa/email", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(data.error || "Erreur lors de l'envoi du code");
      }

      setRemainingTime(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append("code", verificationCode.trim());
      formData.append("method", "authenticator");
      const response = await verify2FA(formData);

      if (response?.success) {
        await update();
        router.push("/"); // 🚀 Rediriger côté client
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la vérification",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleVerify();
  };

  if (status === "loading") {
    return <div>Chargement...</div>;
  }

  // Si la session n'existe pas ou si requires2FA est false, ne pas afficher le formulaire
  if (!session?.user) {
    return <div>Redirection...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="flex-col items-start px-6 pt-6 pb-0">
          <h1 className="text-2xl font-bold">Vérification 2FA</h1>
          <p className="mt-2 text-gray-600">
            {session?.user?.twoFAMethod === "email"
              ? "Entrez le code reçu par email"
              : "Entrez le code affiché sur l'authenticator"}
          </p>
        </CardHeader>

        <CardBody className="px-6">
          {error && (
            <div className="p-4 mb-4 text-red-600 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <div className="flex flex-col items-start gap-2 m-auto">
            <InputOtp
              length={6}
              value={verificationCode}
              onKeyPress={handleKeyPress}
              onValueChange={setVerificationCode}
            />
          </div>

          {session?.user?.twoFAMethod === "email" && (
            <div className="mt-2 text-sm text-center text-gray-600">
              {remainingTime > 0 ? (
                <p>
                  Vous pourrez renvoyer le code dans {remainingTime} secondes
                </p>
              ) : (
                <Button
                  color="default"
                  isDisabled={loading}
                  variant="light"
                  onPress={handleResendCode}
                >
                  Renvoyer le code
                </Button>
              )}
            </div>
          )}
        </CardBody>

        <CardFooter className="px-6 py-4">
          <Button
            className="w-full"
            color="primary"
            isLoading={loading}
            onPress={handleVerify}
          >
            Vérifier
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
