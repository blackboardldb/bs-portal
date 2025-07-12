import { UserProfile } from "@/components/user-profile";
import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-black">
      <section className="p-4 mx-auto space-y-4 max-w-4xl">
        <UserProfile />
        <div className="flex justify-end mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Logout
          </Link>
        </div>
      </section>
    </main>
  );
}
