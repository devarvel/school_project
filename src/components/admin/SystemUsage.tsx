'use client';

import { useState, useEffect } from 'react';
import { Database, Users, Cloud, Trash2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { purgeAuditLogs, getSystemUsage } from '@/actions/admin-actions';
import { cn } from '@/lib/utils';

interface UsageStats {
    database: { usedMB: number; storageMB: number; limitMB: number };
    students: { current: number; total: number; limit: number };
    assets: { count: number; limit: number };
    auditLogs: number;
}

export function SystemUsage() {
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [purging, setPurging] = useState(false);

    const fetchUsage = async () => {
        const res = await getSystemUsage();
        if (res.success && res.usage) {
            setUsage(res.usage);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsage();
    }, []);

    const handlePurge = async () => {
        if (!confirm(`Are you sure you want to delete all ${usage?.auditLogs} audit logs? This action is permanent.`)) return;

        setPurging(true);
        const res = await purgeAuditLogs();
        if (res.success) {
            alert(res.message);
            fetchUsage();
        } else {
            alert(res.error);
        }
        setPurging(false);
    };

    const getProgressColor = (percent: number) => {
        if (percent < 50) return 'bg-emerald-500';
        if (percent < 80) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (loading) return (
        <Card className="bg-slate-900 border-slate-800 animate-pulse">
            <CardContent className="p-12 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
            </CardContent>
        </Card>
    );

    if (!usage) return null;

    const dbPercent = (usage.database.usedMB / usage.database.limitMB) * 100;
    const studentPercent = (usage.students.current / usage.students.limit) * 100;
    const assetPercent = (usage.assets.count / usage.assets.limit) * 100;

    return (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" />
                        System Health & Usage
                    </CardTitle>
                    <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-500/20">
                        Operational
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {/* Database Size */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest">
                            <Database className="w-3.5 h-3.5" />
                            Database Storage
                        </div>
                        <span className="text-slate-300 font-mono">{usage.database.usedMB}MB / {usage.database.limitMB}MB</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000", getProgressColor(dbPercent))}
                            style={{ width: `${Math.min(dbPercent, 100)}%` }}
                        />
                    </div>
                    {dbPercent > 80 && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1 italic">
                            <AlertTriangle className="w-3 h-3" />
                            Storage limit almost reached. Consider purging logs.
                        </p>
                    )}
                </div>

                {/* Student Capacity */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest">
                            <Users className="w-3.5 h-3.5" />
                            Student Capacity
                        </div>
                        <span className="text-slate-300 font-mono">{usage.students.current} / {usage.students.limit}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000", getProgressColor(studentPercent))}
                            style={{ width: `${Math.min(studentPercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Cloudinary Usage */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest">
                            <Cloud className="w-3.5 h-3.5" />
                            Cloud Assets (Estimates)
                        </div>
                        <span className="text-slate-300 font-mono">{usage.assets.count} / {usage.assets.limit}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all duration-1000", getProgressColor(assetPercent))}
                            style={{ width: `${Math.min(assetPercent, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Maintenance Section */}
                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-widest">Maintenance</p>
                        <p className="text-[10px] text-slate-500 mt-1">Free up database space by clearing logs.</p>
                    </div>
                    <button
                        onClick={handlePurge}
                        disabled={purging || usage.auditLogs === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg transition-all border border-red-500/20 disabled:opacity-50"
                    >
                        {purging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Purge Audit Logs ({usage.auditLogs})
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
