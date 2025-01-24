"use client";
import { Button } from "@heroui/button";
import { Checkbox } from "@heroui/checkbox";
import { Input } from "@heroui/input";
import { EyeClosed, EyeIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="p-4 text-red-600 rounded-lg bg-red-50">{message}</div>
);

// Credentials Login Form Component
export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(!isVisible);

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
    <form className="w-full max-w-md space-y-4" onSubmit={handleLogin}>
      {error && <ErrorMessage message={error} />}
      <Input
        required
        label="Email"
        type="email"
        value={email}
        variant="bordered"
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        required
        endContent={
          <button
            aria-label="toggle password visibility"
            className="my-auto focus:outline-none"
            type="button"
            onClick={toggleVisibility}
          >
            {isVisible ? (
              <EyeIcon className="my-auto text-2xl pointer-events-none text-default-400" />
            ) : (
              <EyeClosed className="my-auto text-2xl pointer-events-none text-default-400" />
            )}
          </button>
        }
        label="Mot de passe"
        type={isVisible ? "text" : "password"}
        value={password}
        variant="bordered"
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex justify-between my-5 text-xs">
        <Checkbox size="sm">Se souvenir de moi</Checkbox>
        <p className="my-auto text-gray-400">Mot de passe oublié ?</p>
      </div>
      <Button
        className="w-full"
        color="primary"
        isLoading={loading}
        type="submit"
      >
        Se connecter
      </Button>
    </form>
  );
};
