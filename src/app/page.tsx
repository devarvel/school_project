import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500/30">
      <PublicNavbar />
      <main>
        <Hero />
        <Features />

        {/* Footer */}
        <footer className="py-20 border-t border-slate-900 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-8">
            <div className="flex flex-col items-center gap-4">
              <p className="text-slate-500 text-sm">Ready to digitize your records?</p>
              <a
                href="/login"
                className="px-8 py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/20 rounded-full font-bold transition-all"
              >
                Scholar Portal Access
              </a>
            </div>
            <p className="text-slate-600 text-xs">© 2026 City High School. Built for Academic Excellence.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}