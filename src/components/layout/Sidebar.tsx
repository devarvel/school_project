'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, BookOpen, TrendingUp, LogOut, GraduationCap } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { UserRole } from '@/types/enums';
import { getClassLabel } from '@/lib/constants';


export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const role = session?.user?.role;

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.CLASS_ADMIN] },
        { name: 'My Class', href: '/admin/students', icon: Users, roles: [UserRole.CLASS_ADMIN] },
        { name: 'Promotion', href: '/admin/promotion', icon: TrendingUp, roles: [UserRole.SUPER_ADMIN] },
        { name: 'Blog', href: '/admin/blog', icon: BookOpen, roles: [UserRole.SUPER_ADMIN] },
        { name: 'Users', href: '/admin/users', icon: Users, roles: [UserRole.SUPER_ADMIN] },
    ];

    const filteredItems = navItems.filter(item => item.roles.includes(role as UserRole));

    return (
        <div className="flex flex-col h-screen w-64 bg-slate-900 border-r border-slate-800 text-slate-100">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    Scholar Pro
                </h1>
                <div className="flex flex-col mt-1">
                    <p className="text-xs text-slate-400 uppercase tracking-widest">{role?.replace('-', ' ')}</p>
                    {session?.user?.assignedLevel && (
                        <p className="text-[10px] text-indigo-400 font-bold mt-0.5">CLASS: {getClassLabel(session.user.assignedLevel).toUpperCase()}</p>
                    )}
                </div>

            </div>

            <nav className="flex-1 px-4 space-y-2">
                {filteredItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-indigo-600/20 text-indigo-400"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
