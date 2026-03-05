import { Sidebar } from '@/components/layout/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            <Sidebar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pt-20 lg:pt-8 bg-slate-950">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
