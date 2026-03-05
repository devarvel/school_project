'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { processSessionEndPromotion } from '@/actions/promotion-actions';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { getClassLabel } from '@/lib/constants';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/enums';
import { useRouter } from 'next/navigation';

interface StudentList {
    _id: string;
    admissionNum: string;
    surname: string;
    currentLevel: number;
}

export default function PromotionPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role !== UserRole.SUPER_ADMIN) {
            router.push('/admin/dashboard');
        }
    }, [session, status, router]);

    const [students, setStudents] = useState<StudentList[]>([]);
    const [failedIds, setFailedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetch('/api/admin/students')
            .then(res => res.json())
            .then(data => {
                setStudents(data);
                setLoading(false);
            });
    }, []);

    const toggleFailed = (id: string) => {
        setFailedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const [confirmOpen, setConfirmOpen] = useState(false);

    const handlePromotion = () => {
        setConfirmOpen(true);
    };

    const handleFinalPromotion = async () => {
        setConfirmOpen(false);
        setProcessing(true);
        const result = await processSessionEndPromotion(failedIds);
        setProcessing(false);

        if (result.success) {
            setMessage({ type: 'success', text: result.message! });
            setFailedIds([]);
        } else {
            setMessage({ type: 'error', text: result.error! });
        }
    };

    if (loading) return <div className="text-slate-400">Loading student list...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Session Promotion</h2>
                    <p className="text-slate-400">Select students who FAILED to mark them as repeaters.</p>
                </div>
                <button
                    onClick={handlePromotion}
                    disabled={processing || students.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20"
                >
                    {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    End Session & Promote
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Session End Confirmation Guard */}
            {confirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl">
                        <CardHeader className="text-center p-8 pb-4">
                            <div className="mx-auto p-4 bg-amber-500/10 rounded-full w-fit mb-4">
                                <AlertCircle className="w-10 h-10 text-amber-500" />
                            </div>
                            <CardTitle className="text-2xl text-white">Final Confirmation</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 text-center space-y-6">
                            <p className="text-slate-400">
                                You are about to <span className="text-white font-bold">End the Academic Session</span>.
                                This is a critical system action that performs the following:
                            </p>

                            <ul className="text-left text-sm bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                    <span>Promotes all active students by 1 level</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                    <span>Marks <span className="text-white font-bold">{failedIds.length} students</span> as repeaters</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-300">
                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                    <span>Archives graduating students (SS 3)</span>
                                </li>
                            </ul>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setConfirmOpen(false)}
                                    className="flex-1 py-3 text-slate-400 hover:text-white font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleFinalPromotion}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    Yes, Run Promotion
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Active Students List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="bg-slate-800/50 text-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Admission #</th>
                                    <th className="px-6 py-4 font-medium">Surname</th>
                                    <th className="px-6 py-4 font-medium text-center">Current Level</th>
                                    <th className="px-6 py-4 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {students.map((student) => {
                                    const isFailed = failedIds.includes(student._id);
                                    return (
                                        <tr
                                            key={student._id}
                                            className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${isFailed ? 'bg-red-500/5' : ''}`}
                                            onClick={() => toggleFailed(student._id)}
                                        >
                                            <td className="px-6 py-4 font-mono">{student.admissionNum}</td>
                                            <td className="px-6 py-4 font-semibold">{student.surname}</td>
                                            <td className="px-6 py-4 text-center">{getClassLabel(student.currentLevel)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${isFailed ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
                                                    }`}>
                                                    {isFailed ? 'REPEATING' : 'PROMOTING'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
