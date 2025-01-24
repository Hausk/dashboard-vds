import { Button } from "@heroui/button";
import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";

// Google Sign-in Button Component
export const GoogleSignInButton = () => {
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/login" });
  };

  return (
    <Button
      className="w-full"
      color="default"
      startContent={<FaGoogle size={18} />}
      variant="ghost"
      onPress={handleGoogleSignIn}
    >
      Continuer avec Google
    </Button>
  );
};
