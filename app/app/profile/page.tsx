"use client";

import { UserProfile } from "@/components/user-profile";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-black">
      <section className="p-4 mx-auto space-y-6 max-w-4xl pb-28">
        <UserProfile />
        <Link href="/" className="w-full block">
          <Button
            variant="outline"
            className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Cerrar Sesión (Demo)
          </Button>
        </Link>
      </section>
    </main>
  );
}
