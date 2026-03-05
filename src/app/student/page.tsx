import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/db";
import { Student } from "@/models/User";
import { Result } from "@/models/Result";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Unlock, FileText, Calendar, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
import { UserRole } from "@/types/enums";
import { cn } from "@/lib/utils";
import { PaymentButton } from "@/components/student/PaymentButton";
import { TokenUnlock } from "@/components/student/TokenUnlock";
import { PaymentVerification } from "@/components/student/PaymentVerification";
import { getClassLabel } from '@/lib/constants';
import { Suspense } from "react";
import { getStudentPaymentHistory } from "@/actions/student-data-actions";

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.STUDENT) {
        redirect("/login");
    }

    await connectToDatabase();
    const student = await Student.findOne({ admissionNum: session.user.admissionNum });

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-white">Profile Not Found</h2>
                <p className="text-slate-400">Please contact the admin to verify your admission details.</p>
            </div>
        );
    }

    const results = await Result.find({ studentId: student._id }).sort({ createdAt: -1 });

    // Group results by session
    const resultsBySession = results.reduce((acc: Record<string, typeof results>, result) => {
        const session = result.session;
        if (!acc[session]) acc[session] = [];
        acc[session].push(result);
        return acc;
    }, {});

    const sessions = Object.keys(resultsBySession).sort((a, b) => b.localeCompare(a));

    const { payments = [] } = await getStudentPaymentHistory();
    const totalSpent = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    return (
        <div className="relative min-h-screen text-slate-100 pb-20">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-600/10 blur-[100px]" />
            </div>

            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
                <Suspense>
                    <PaymentVerification />
                </Suspense>
                {/* Header Profile Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-indigo-500/25 border border-white/20">
                            {student.surname[0]}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white">{student.surname}</h2>
                            <p className="text-indigo-400 font-mono tracking-wider">{student.admissionNum}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Current Class</p>
                            <p className="text-xl font-bold text-white">{getClassLabel(student.currentLevel)}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner">
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Status</p>
                            <p className={cn(
                                "text-xl font-bold",
                                student.status === "Active" ? "text-emerald-400" : "text-amber-400"
                            )}>{student.status}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner col-span-2 md:col-span-1 hidden md:block">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Spent</p>
                            <p className="text-xl font-bold text-indigo-400">₦{totalSpent.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Academic History
                        </h3>

                        {sessions.length === 0 ? (
                            <Card className="bg-white/5 backdrop-blur-md border-dashed border-white/10 rounded-3xl">
                                <CardContent className="py-12 text-center text-slate-400">
                                    No results have been uploaded for you yet.
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-10">
                                {sessions.map(sessionYear => (
                                    <div key={sessionYear} className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <h4 className="text-lg font-bold text-white px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 shadow-sm">{sessionYear} Session</h4>
                                            <div className="h-px bg-white/10 flex-1"></div>
                                        </div>
                                        <div className="grid gap-4">
                                            {resultsBySession[sessionYear].map((result) => (
                                                <Card key={result._id.toString()} className="overflow-hidden bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all hover:bg-white/10 shadow-2xl rounded-3xl">
                                                    <CardContent className="p-0">
                                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                                                            <div className="p-6 flex-1 flex items-center gap-4">
                                                                <div className={cn(
                                                                    "p-3 rounded-xl",
                                                                    result.isPaid ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                                                                )}>
                                                                    {result.isPaid ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-lg font-bold text-white">{result.term} Term</h4>
                                                                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {result.session}</span>
                                                                        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                                                                        <span>{result.isPaid ? 'Unlocked' : 'Payment Required'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="p-6 bg-black/10 backdrop-blur-md sm:border-l border-white/5 flex items-center justify-center sm:w-48">
                                                                {result.isPaid ? (
                                                                    <div className="space-y-2 w-full">
                                                                        <Link
                                                                            href={`/student/result/${result._id}`}
                                                                            target="_blank"
                                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors"
                                                                        >
                                                                            <FileText className="w-4 h-4" />
                                                                            View Result
                                                                        </Link>
                                                                        {result.accessToken && (
                                                                            <div className="flex flex-col items-center">
                                                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Access Token</p>
                                                                                <p className="text-sm font-mono font-bold text-white tracking-[0.2em]">{result.accessToken}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full space-y-2">
                                                                        <PaymentButton resultId={result._id.toString()} />
                                                                        <TokenUnlock resultId={result._id.toString()} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment History Section */}
                    <div className="space-y-6 pt-8 border-t border-slate-800/50">
                        <h3 className="text-xl font-bold text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-500" />
                                Payment History
                            </div>
                            <div className="text-sm font-normal text-slate-400 md:hidden">
                                Total: <span className="text-indigo-400 font-bold">₦{totalSpent.toLocaleString()}</span>
                            </div>
                        </h3>

                        {payments.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-white/10">
                                No payment records found.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-black/20 border-b border-white/5">
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reference</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Class</th>
                                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {payments.map((payment: any) => (
                                                <tr key={payment._id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-sm text-slate-300">
                                                        {new Date(payment.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-400">
                                                        {payment.reference}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-300">
                                                        {getClassLabel(payment.classAtTimeOfPayment)}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-white text-right">
                                                        ₦{payment.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
