import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, GraduationCap, School } from "lucide-react";
import connectToDatabase from "@/lib/db";
import { Student } from "@/models/User";
import { Payment as PaymentModel } from "@/models/Payment";
import { UserRole } from "@/types/enums";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getStats(role?: string, assignedLevel?: number) {
    await connectToDatabase();

    // Default to zero stats
    let stats = {
        students: 0,
        archived: 0,
        revenue: 0,
    };

    if (role === UserRole.SUPER_ADMIN) {
        // Global stats for Super Admin
        stats.students = await Student.countDocuments({ status: "Active" });
        stats.archived = await Student.countDocuments({ status: "Archived" });

        const revenueAgg = await PaymentModel.aggregate([
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        stats.revenue = revenueAgg[0]?.total || 0;
    } else if (role === UserRole.CLASS_ADMIN) {
        // Filtered stats for Class Admin - must have assignedLevel
        if (assignedLevel !== undefined && assignedLevel !== null) {
            stats.students = await Student.countDocuments({ status: "Active", currentLevel: assignedLevel });
            stats.archived = await Student.countDocuments({ status: "Archived", currentLevel: assignedLevel });

            const revenueAgg = await PaymentModel.aggregate([
                { $match: { classAtTimeOfPayment: assignedLevel } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]);
            stats.revenue = revenueAgg[0]?.total || 0;
        }
    }

    return stats;
}

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);
    const stats = await getStats(session?.user?.role, session?.user?.assignedLevel);
    const isClassAdmin = session?.user?.role === UserRole.CLASS_ADMIN;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    {isClassAdmin ? 'Class Dashboard' : 'System Dashboard'}
                </h2>
                <p className="text-slate-400">
                    {isClassAdmin ? 'Overview of your assigned class.' : 'Overview of school performance.'}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Students */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Active Students
                        </CardTitle>
                        <Users className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.students}</div>
                        <p className="text-xs text-slate-400">Enrolled in current session</p>
                    </CardContent>
                </Card>

                {/* Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Total Revenue
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            ₦{stats.revenue.toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-400">Lifetime collected</p>
                    </CardContent>
                </Card>

                {/* Archived */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Archived Students
                        </CardTitle>
                        <GraduationCap className="h-4 w-4 text-amber-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.archived}</div>
                        <p className="text-xs text-slate-400">Graduated / Left</p>
                    </CardContent>
                </Card>

                {/* System Status (Placeholder) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            System Status
                        </CardTitle>
                        <School className="h-4 w-4 text-cyan-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">Healthy</div>
                        <p className="text-xs text-slate-400">All services operational</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
