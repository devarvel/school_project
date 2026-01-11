import { StudentNavbar } from "@/components/layout/StudentNavbar";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            <StudentNavbar />
            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                {children}
            </main>

            <footer className="py-8 bg-slate-900 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
                    © 2026 Scholar Portal Pro. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
