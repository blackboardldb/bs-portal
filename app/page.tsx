import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="p-4 max-w-4xl mx-auto text-white space-y-3 flex flex-col items-center">
        <Logo size={240} />
        <Link href="/app">
          <Button className="w-full" variant={"default"}>
            <span>Entrar</span>
          </Button>
        </Link>
        <Link href="/admin">
          <Button className="w-full text-black" variant={"outline"}>
            <span>Admin</span>
          </Button>
        </Link>
      </div>
    </main>
  );
}
