'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { GraduationCap, LogOut, User, FileText, Layout } from 'lucide-react';

export function StudentNavbar() {
    const { data: session } = useSession();

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/student" className="flex items-center gap-2">
                            <GraduationCap className="w-8 h-8 text-indigo-500" />
                            <span className="text-xl font-bold text-white tracking-tighter">Portal<span className="text-indigo-500">Pro</span></span>
                        </Link>

                        <div className="hidden md:flex items-center gap-4">
                            <Link href="/student" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                                <Layout className="w-4 h-4" /> My Dashboard
                            </Link>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-slate-950 rounded-full border border-slate-800">
                            <User className="w-4 h-4 text-indigo-400" />
                            <span className="text-xs font-semibold text-slate-300">{session?.user?.name}</span>
                        </div>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
