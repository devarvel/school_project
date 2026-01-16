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

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Suspense>
                <PaymentVerification />
            </Suspense>
            {/* Header Profile Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-indigo-500/20">
                        {student.surname[0]}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white">{student.surname}</h2>
                        <p className="text-indigo-400 font-mono tracking-wider">{student.admissionNum}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Current Class</p>
                        <p className="text-xl font-bold text-white">{getClassLabel(student.currentLevel)}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status</p>
                        <p className={cn(
                            "text-xl font-bold",
                            student.status === "Active" ? "text-emerald-400" : "text-amber-400"
                        )}>{student.status}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Academic History
                </h3>

                <div className="grid gap-4">
                    {results.length === 0 ? (
                        <Card className="bg-slate-900/50 border-dashed">
                            <CardContent className="py-12 text-center text-slate-500">
                                No results have been uploaded for you yet.
                            </CardContent>
                        </Card>
                    ) : (
                        results.map((result) => (
                            <Card key={result._id.toString()} className="overflow-hidden bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all hover:bg-slate-900/60">
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

                                        <div className="p-6 bg-slate-950/50 sm:border-l border-slate-800 flex items-center justify-center sm:w-48">
                                            {result.isPaid ? (
                                                <div className="space-y-2">
                                                    <Link
                                                        href={result.pdfUrl}
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
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
