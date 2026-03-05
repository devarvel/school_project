'use client';

import { useState } from 'react';
import { Key, X, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetStudentPassword } from '@/actions/student-actions';

interface ResetStudentPasswordButtonProps {
    studentId: string;
    admissionNum: string;
    studentName: string;
}

export function ResetStudentPasswordButton({ studentId, admissionNum, studentName }: ResetStudentPasswordButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await resetStudentPassword(studentId, newPassword);
        setLoading(false);

        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                setIsOpen(false);
                setSuccess(false);
                setNewPassword('');
            }, 2000);
        } else {
            setError(res.error || 'Failed to reset password');
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                title="Reset Student Password"
            >
                <Key className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Key className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">Set Student Password</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{studentName} ({admissionNum})</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-500 hover:text-white transition-colors"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {success ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-90">
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold">Success!</p>
                                        <p className="text-sm text-slate-400">Student credentials updated.</p>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleReset} className="space-y-6">
                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">New Password</label>
                                        <div className="relative">
                                            <input
                                                autoFocus
                                                required
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                                                placeholder="Min. 3 characters"
                                                minLength={3}
                                                disabled={loading}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500 px-1 italic">Student will no longer log in with their surname after this update.</p>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="flex-1 py-3 text-slate-400 hover:text-white font-bold transition-colors"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || newPassword.length < 3}
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set Password"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
