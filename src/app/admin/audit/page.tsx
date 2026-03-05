'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, ChevronLeft, ChevronRight, Loader2, Calendar, User, Activity } from 'lucide-react';
import { getAuditLogs } from '@/actions/audit-actions';
import { cn } from '@/lib/utils';

export default function AuditLogPage() {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getAuditLogs(page).then(res => {
            if (res.success) {
                setData(res);
            }
            setLoading(false);
        });
    }, [page]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('PURGE')) return 'text-red-400 bg-red-400/10';
        if (action.includes('CREATE') || action.includes('UPLOAD')) return 'text-emerald-400 bg-emerald-400/10';
        if (action.includes('UPDATE') || action.includes('CHANGE')) return 'text-amber-400 bg-amber-400/10';
        return 'text-indigo-400 bg-indigo-400/10';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Audit Log</h2>
                    <p className="text-slate-400">Track all administrative actions performed on the system.</p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <ClipboardList className="w-8 h-8" />
                </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-950/50 font-bold border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Admin</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                                            <p className="mt-2 text-slate-500">Loading audit logs...</p>
                                        </td>
                                    </tr>
                                ) : data?.logs?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">
                                            No audit logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.logs?.map((log: any) => (
                                        <tr key={log._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(log.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-200 font-medium flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                                        {log.performedBy}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                        {log.performedByRole}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                                                    getActionColor(log.action)
                                                )}>
                                                    {log.action.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 max-w-xs truncate" title={log.details}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {!loading && data?.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-slate-500">
                        Showing page <span className="text-white font-bold">{data.currentPage}</span> of <span className="text-white font-bold">{data.totalPages}</span> ({data.total} total logs)
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                            disabled={page === data.totalPages}
                            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
