import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

async function DashboardContent() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email || "Creator";

  return (
    <main className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 p-6">
      <div className="flex-1 flex items-center justify-center">
        <h1 className="text-3xl font-semibold">{displayName}</h1>
      </div>

      <footer className="pb-6 flex justify-center">
        <LogoutButton />
      </footer>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
          Loading...
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
