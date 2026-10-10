import { Sidebar } from "./sidebar";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <div className="flex h-screen overflow-hidden bg-slate-50">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
