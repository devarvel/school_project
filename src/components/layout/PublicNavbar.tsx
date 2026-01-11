'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export function PublicNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300 border-b",
            isScrolled
                ? "bg-slate-950/80 backdrop-blur-lg border-slate-800 py-3"
                : "bg-transparent border-transparent py-5"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <GraduationCap className="w-8 h-8 text-indigo-500 group-hover:rotate-12 transition-transform" />
                    <span className="text-xl font-bold text-white tracking-tighter">
                        City <span className="text-indigo-500">High</span>
                    </span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <Link href="/blog" className="text-slate-400 hover:text-white transition-colors">Blog</Link>
                    <Link href="/#features" className="text-slate-400 hover:text-white transition-colors">Features</Link>
                </div>

                <Link
                    href="/login"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    Check Results
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </nav>
    );
}
