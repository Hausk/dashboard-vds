// /app/setup-2fa/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardBody, CardFooter, CardHeader } from "@heroui/card";
import { Radio, RadioGroup } from "@heroui/radio";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Alert } from "@heroui/alert";
import { Snippet } from "@heroui/snippet";

export default function Setup2FA() {
  const router = useRouter();
  const [method, setMethod] = useState<"email" | "authenticator">("email");
  const [step, setStep] = useState<"choose" | "setup" | "verify">("choose");
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleMethodSelect = async () => {
    setLoading(true);
    setError("");

    try {
      if (method === "email") {
        const response = await fetch("/api/auth/setup-2fa/email", {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json();

          throw new Error(data.error || "Failed to send verification email");
        }
      } else {
        const response = await fetch("/api/auth/setup-2fa/authenticator", {
          method: "POST",
        });

        if (!response.ok) {
          const data = await response.json();

          throw new Error(
            data.error || "Failed to generate authenticator setup",
          );
        }

        const data = await response.json();

        setQrCode(data.qrCodeUrl);
        setSecret(data.secret);
      }

      setStep("setup");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la configuration.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: verificationCode,
          method,
        }),
      });

      if (!response.ok) {
        throw new Error("Code de vérification invalide");
      }

      // Redirection vers la page principale après vérification réussie
      router.push("/dashboard");
    } catch (err) {
      setError("Code de vérification invalide");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex-col items-start px-6 pt-6 pb-0">
          <h1 className="text-2xl font-bold">Configuration de la 2FA</h1>
          {step === "choose" && (
            <p className="mt-2 text-gray-600">
              Choisissez votre méthode d&apos;authentification à deux facteurs
            </p>
          )}
        </CardHeader>

        <CardBody className="px-6">
          {step === "choose" && (
            <RadioGroup
              value={method}
              onValueChange={(value) =>
                setMethod(value as "email" | "authenticator")
              }
            >
              <Radio value="email">
                Vérification par email
                <span className="block text-sm text-gray-500">
                  Recevez un code de vérification par email à chaque connexion
                  depuis un nouvel appareil
                </span>
              </Radio>
              <Radio value="authenticator">
                Application d&apos;authentification
                <span className="block text-sm text-gray-500">
                  Utilisez une application comme Google Authenticator pour
                  générer des codes
                </span>
              </Radio>
            </RadioGroup>
          )}

          {step === "setup" && method === "authenticator" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCode && (
                  <div className="p-4 bg-white rounded-lg">
                    <Image
                      alt="QR Code"
                      height={200}
                      src={qrCode}
                      width={200}
                    />
                  </div>
                )}
              </div>
              <div className="text-center">
                <p className="mb-2 text-sm text-gray-600">
                  Clé secrète (en cas de problème avec le QR code) :
                </p>
                <Snippet hideSymbol className="p-2 rounded">
                  {secret}
                </Snippet>
              </div>
              <ol className="ml-4 space-y-2 list-decimal">
                <li>
                  Installez une application d&apos;authentification (Google
                  Authenticator, Authy...)
                </li>
                <li>
                  Scannez le QR code ou entrez la clé secrète manuellement
                </li>
                <li>
                  Entrez le code généré par l&apos;application ci-dessous pour
                  vérifier la configuration
                </li>
              </ol>
            </div>
          )}

          {step === "setup" && method === "email" && (
            <p className="py-4 text-center">
              Un code de vérification a été envoyé à votre adresse email.
            </p>
          )}

          {step === "setup" && (
            <Input
              className="mt-4"
              label="Code de vérification"
              placeholder="Entrez le code"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
          )}
        </CardBody>

        <CardFooter className="px-6 py-4">
          {step === "choose" ? (
            <Button
              className="w-full"
              color="primary"
              isLoading={loading}
              onClick={handleMethodSelect}
            >
              Continuer
            </Button>
          ) : (
            <div className="flex w-full gap-3">
              <Button
                className="flex-1"
                color="default"
                variant="flat"
                onClick={() => setStep("choose")}
              >
                Retour
              </Button>
              <Button
                className="flex-1"
                color="primary"
                isLoading={loading}
                onClick={handleVerify}
              >
                Vérifier
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      {error && (
        <Alert className="fixed w-auto bottom-2 right-5" color="danger">
          {error}
        </Alert>
      )}
    </div>
  );
}
