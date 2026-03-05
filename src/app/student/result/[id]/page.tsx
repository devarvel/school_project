import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/db";
import { Result } from "@/models/Result";
import { getStudentResultWithRank } from "@/actions/result-actions";
import { getGlobalSettings } from "@/actions/settings-actions";
import PrintableResult from "@/components/PrintableResult";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Using dynamic rendering because params and DB fetch
export const dynamic = 'force-dynamic';

export default async function ViewResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    await connectToDatabase();

    // Validate result existence and access
    console.log("Fetching result with ID:", id);
    const rawResult = await Result.findById(id);
    console.log("Raw result found:", rawResult !== null);
    if (!rawResult) {
        return <div className="p-8 text-center text-white">Result not found.</div>;
    }

    if (session.user.role === 'Student' && rawResult.studentId.toString() !== session.user.id) {
        return <div className="p-8 text-center text-white">Unauthorized access.</div>;
    }

    // Wait for rank calculation
    const rankData = await getStudentResultWithRank(
        rawResult.studentId.toString(),
        rawResult.term,
        rawResult.session
    );

    if (!rankData.success) {
        return <div className="p-8 text-center text-white">Error loading result details: {rankData.error}</div>;
    }

    // Fetch school settings for logo, stamp, signature
    const settingsRes = await getGlobalSettings();

    const resultProps = {
        student: {
            name: `${rankData.student.surname} ${rankData.student.firstName || ''} ${rankData.student.otherNames || ''}`.trim(),
            admissionNum: rankData.student.admissionNum,
            currentLevel: rankData.student.currentLevel,
        },
        result: {
            term: rankData.result.term,
            session: rankData.result.session,
            scores: rankData.result.scores || [],
            classTeacherRemark: rankData.result.classTeacherRemark || '',
            headTeacherRemark: rankData.result.headTeacherRemark || '',
            attendance: rankData.result.attendance,
            affectiveTraits: rankData.result.affectiveTraits,
            psychomotorSkills: rankData.result.psychomotorSkills,
        },
        stats: rankData.stats,
        settings: {
            schoolLogo: settingsRes.schoolLogo,
            schoolStamp: settingsRes.schoolStamp,
            directorSignature: settingsRes.directorSignature,
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-950 overflow-hidden font-sans">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/10 blur-[120px]" />
            </div>

            <div className="relative z-10 p-4 md:p-8 animate-in fade-in max-w-7xl mx-auto">
                <div className="max-w-[210mm] mx-auto mb-6">
                    <Link
                        href={session.user.role === 'Student' ? "/student" : "/admin/students"}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-all shadow-lg w-fit font-medium text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>
                <PrintableResult {...resultProps} />
            </div>
        </div>
    );
}
