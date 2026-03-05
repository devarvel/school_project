'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClassAdmin } from '@/actions/admin-actions';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, UserPlus, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getClassLabel, LEVELS } from '@/lib/constants';

export default function NewUserPage() {
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleInitialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        setReviewData(data);
        setConfirming(true);
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);

        const res = await createClassAdmin(reviewData);
        setLoading(false);

        if (res.success) {
            router.push('/admin/users');
        } else {
            setError(res.error || 'Something went wrong');
            setConfirming(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/users" className="p-2 text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h2 className="text-3xl font-bold text-white tracking-tight italic">Add Class Admin</h2>
            </div>

            <form onSubmit={handleInitialSubmit}>
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-indigo-400 flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Security Credentials
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6 relative">
                        {/* Confirmation Overlay */}
                        {confirming && (reviewData) && (
                            <div className="absolute inset-0 z-10 bg-slate-900/95 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                                <div className="p-3 bg-amber-500/10 rounded-full mb-4">
                                    <AlertCircle className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Review Account Details</h3>
                                <p className="text-slate-400 text-sm mb-6 max-w-xs">Please double check the class assignment and email before proceeding.</p>

                                <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-xl p-4 mb-8 text-left space-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Email Address</p>
                                        <p className="text-white font-medium">{reviewData.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Assigned Class</p>
                                        <p className="text-indigo-400 font-bold">{getClassLabel(Number(reviewData.assignedLevel))}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 w-full max-w-sm">
                                    <button
                                        type="button"
                                        onClick={() => setConfirming(false)}
                                        className="flex-1 py-3 text-slate-400 hover:text-white font-bold transition-colors"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={loading}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        Confirm & Create
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-lg flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Email Address</label>
                            <input
                                required
                                name="email"
                                type="email"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-slate-800"
                                placeholder="teacher@school.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Initial Password</label>
                            <div className="relative">
                                <input
                                    required
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-slate-800 pr-12"
                                    placeholder="Min. 8 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Assigned Class</label>
                            <select
                                name="assignedLevel"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            >
                                {LEVELS.map((level) => (
                                    <option key={level} value={level}>{getClassLabel(level)}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Create Admin Account
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
