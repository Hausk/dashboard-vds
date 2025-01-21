"use client";

import { Button } from "@heroui/button";
import { signOut } from "next-auth/react";

import { HeartFilledIcon } from "./icons";

export default function ClientDisconnect() {
  return (
    <Button
      className="text-sm font-normal text-default-600 bg-default-100"
      startContent={<HeartFilledIcon className="text-danger" />}
      variant="flat"
      onPress={() => signOut()}
    >
      Deconnexion
    </Button>
  );
}
