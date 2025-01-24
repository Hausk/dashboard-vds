"use client";

import { signOut } from "next-auth/react";

export default function Dashboard() {
  return (
    <div className="flex bg-red-500">
      <h1>Bienvenue sur le Dashboard</h1>
      <Button onPress={() => signOut()}>Se déconnecter</Button>
    </div>
  );
}
