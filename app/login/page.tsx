"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";

import { LoginForm } from "@/components/login/login-form";
import { GoogleSignInButton } from "@/components/login/google-button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);

        return;
      }

      // Redirection basée sur la réponse
      if (result?.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-violet-600 to-pink-700">
      <Card className="w-full p-4 space-y-4 rounded-lg max-w-[400px]">
        <CardHeader className="text-center">Se connecter</CardHeader>
        <CardBody className="text-center">
          <LoginForm />
          <div className="relative flex justify-between w-full gap-4 my-5">
            <Divider className="w-full my-auto" />
            <p className="absolute px-5 text-xs text-gray-500 -translate-x-1/2 -translate-y-1/2 bg-content1 top-1/2 left-1/2">
              OU
            </p>
          </div>
          <GoogleSignInButton />
        </CardBody>
      </Card>
    </div>
  );
}
