import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Shield, UserPlus } from "lucide-react";
import connectToDatabase from "@/lib/db";
import { Admin, UserRole } from "@/models/User";
import { getClassLabel } from "@/lib/constants";
import { DeleteAdminButton } from "@/components/admin/DeleteAdminButton";
import { ResetPasswordButton } from "@/components/admin/ResetPasswordButton";

import Link from "next/link";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== UserRole.SUPER_ADMIN) {
        redirect('/admin/dashboard');
    }

    await connectToDatabase();
    const admins = await Admin.find({ role: UserRole.CLASS_ADMIN }).sort({ assignedLevel: 1 });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Class Management</h2>
                    <p className="text-slate-400">Manage Class-Admins and their assigned classes.</p>
                </div>
                <Link
                    href="/admin/users/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Class Admin
                </Link>
            </div>

            <div className="grid gap-4">
                {admins.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">No Class-Admins found.</p>
                ) : (
                    admins.map((admin) => (
                        <Card key={admin._id.toString()}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-500/10 rounded-full">
                                        <Shield className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded uppercase tracking-widest border border-indigo-500/20">
                                                {getClassLabel(admin.assignedLevel!)}
                                            </span>
                                            <h3 className="text-white font-medium">{admin.email}</h3>
                                        </div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Form Teacher Access</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <ResetPasswordButton adminId={admin._id.toString()} email={admin.email} />
                                    <DeleteAdminButton adminId={admin._id.toString()} />
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
