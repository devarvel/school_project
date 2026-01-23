'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, ShieldCheck, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const credentials = Object.fromEntries(formData.entries());

        const result = await signIn(isAdmin ? 'admin-login' : 'student-login', {
            redirect: false,
            ...credentials
        });

        if (result?.error) {
            setError('Invalid credentials. Please try again.');
            setLoading(false);
        } else {
            router.push(isAdmin ? '/admin/dashboard' : '/student');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tighter text-white">
                        Scholar <span className="text-indigo-500">Portal</span>
                    </h1>
                    <p className="text-slate-400 text-sm">Secure Digital Academic Vault</p>
                </div>

                <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl">
                    <CardHeader>
                        <div className="flex bg-slate-950 p-1 rounded-lg mb-4">
                            <button
                                onClick={() => setIsAdmin(false)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all",
                                    !isAdmin ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <GraduationCap className="w-4 h-4" />
                                Student
                            </button>
                            <button
                                onClick={() => setIsAdmin(true)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all",
                                    isAdmin ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Admin
                            </button>
                        </div>
                        <CardTitle className="text-xl text-center text-white">
                            {isAdmin ? 'Staff Authentication' : 'Student Access'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            {isAdmin ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                                        <input name="email" type="email" required autoCapitalize="none" autoCorrect="off" spellCheck="false" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                                        <div className="relative">
                                            <input
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                autoCapitalize="none"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admission Number</label>
                                        <input name="admissionNum" type="text" required autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="SCH/2024/001" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Surname</label>
                                        <input name="surname" type="text" required autoCapitalize="none" autoCorrect="off" spellCheck="false" placeholder="Surname" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase" />
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-indigo-500/20 group"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Sign In</span>}
                                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-slate-500 text-xs mt-8">
                    Need help? Contact school administration.
                </p>
            </div>
        </div>
    );
}
