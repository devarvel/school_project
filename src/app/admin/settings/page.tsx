'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Key, Save, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Settings, Image as ImageIcon, Briefcase, PenTool } from 'lucide-react';
import { changePassword } from '@/actions/password-actions';
import { getGlobalSettings, updateResultUnlockFee, updateSchoolAssets } from '@/actions/settings-actions';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/ui/FileUpload';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/enums';

export default function SettingsPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === UserRole.SUPER_ADMIN;
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Global Settings states
    const [feeLoading, setFeeLoading] = useState(false);
    const [feeMessage, setFeeMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [unlockFee, setUnlockFee] = useState<number | ''>('');

    // Assets states
    const [assetsLoading, setAssetsLoading] = useState(false);
    const [assetsMessage, setAssetsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [schoolLogo, setSchoolLogo] = useState<string>('');
    const [schoolStamp, setSchoolStamp] = useState<string>('');
    const [directorSignature, setDirectorSignature] = useState<string>('');

    useEffect(() => {
        const fetchSettings = async () => {
            const res = await getGlobalSettings();
            if (res.success) {
                if (res.fee !== undefined) setUnlockFee(res.fee);
                if (res.schoolLogo) setSchoolLogo(res.schoolLogo);
                if (res.schoolStamp) setSchoolStamp(res.schoolStamp);
                if (res.directorSignature) setDirectorSignature(res.directorSignature);
            }
        };
        fetchSettings();
    }, []);

    // Password visibility states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData(e.currentTarget);
        const currentPassword = formData.get('currentPassword') as string;
        const newPassword = formData.get('newPassword') as string;
        const confirmPassword = formData.get('confirmPassword') as string;

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            setLoading(false);
            return;
        }

        const res = await changePassword(currentPassword, newPassword);

        if (res.success) {
            setMessage({ type: 'success', text: res.message || 'Password updated effectively.' });
            (e.target as HTMLFormElement).reset();
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to update password.' });
        }

        setLoading(false);
    };

    const handleFeeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFeeLoading(true);
        setFeeMessage(null);

        const feeToUpdate = typeof unlockFee === 'string' ? parseFloat(unlockFee) : unlockFee;

        if (isNaN(feeToUpdate) || feeToUpdate < 0) {
            setFeeMessage({ type: 'error', text: 'Please enter a valid positive number.' });
            setFeeLoading(false);
            return;
        }

        const res = await updateResultUnlockFee(feeToUpdate);

        if (res.success) {
            setFeeMessage({ type: 'success', text: res.message || 'Fee updated successfully.' });
            if (res.fee !== undefined) setUnlockFee(res.fee);
        } else {
            setFeeMessage({ type: 'error', text: res.error || 'Failed to update fee.' });
        }
        setFeeLoading(false);
    };

    const handleAssetsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setAssetsLoading(true);
        setAssetsMessage(null);

        const res = await updateSchoolAssets({
            schoolLogo,
            schoolStamp,
            directorSignature
        });

        if (res.success) {
            setAssetsMessage({ type: 'success', text: res.message || 'Assets updated successfully.' });
        } else {
            setAssetsMessage({ type: 'error', text: res.error || 'Failed to update assets.' });
        }
        setAssetsLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
                    <p className="text-slate-400">Manage your account security and preferences.</p>
                </div>
            </div>

            <div className="max-w-2xl">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <Key className="w-5 h-5 text-indigo-400" />
                            Change Password
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {message && (
                                <div className={cn(
                                    "p-4 rounded-lg flex items-center gap-3 text-sm border animate-in fade-in slide-in-from-top-1 duration-300",
                                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                )}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Current Password</label>
                                <div className="relative group">
                                    <input
                                        name="currentPassword"
                                        type={showCurrent ? "text" : "password"}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-indigo-500 border-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                        placeholder="Enter current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(!showCurrent)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                    >
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">New Password</label>
                                    <div className="relative">
                                        <input
                                            name="newPassword"
                                            type={showNew ? "text" : "password"}
                                            required
                                            minLength={8}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-indigo-500 border-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Min 8 characters"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNew(!showNew)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Confirm New Password</label>
                                    <div className="relative">
                                        <input
                                            name="confirmPassword"
                                            type={showConfirm ? "text" : "password"}
                                            required
                                            minLength={8}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-indigo-500 border-slate-800 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600"
                                            placeholder="Repeat password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Save New Password
                            </button>
                        </form>
                    </CardContent>
                </Card>

                {isSuperAdmin && (<>
                    <Card className="bg-slate-900 border-slate-800 mt-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Settings className="w-5 h-5 text-indigo-400" />
                                Global Application Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleFeeSubmit} className="space-y-6">
                                {feeMessage && (
                                    <div className={cn(
                                        "p-4 rounded-lg flex items-center gap-3 text-sm border animate-in fade-in slide-in-from-top-1 duration-300",
                                        feeMessage.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                    )}>
                                        {feeMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        {feeMessage.text}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Result Unlock Fee</label>
                                    <div className="relative group">
                                        <input
                                            name="resultUnlockFee"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            required
                                            value={unlockFee}
                                            onChange={(e) => setUnlockFee(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-4 pr-12 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 focus:border-indigo-500"
                                            placeholder="Enter fee amount"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none">
                                            NGN
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 px-1 mt-1">
                                        This amount is required for students to unlock their results.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={feeLoading}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                                >
                                    {feeLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Settings
                                </button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800 mt-6 mb-12">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <ImageIcon className="w-5 h-5 text-indigo-400" />
                                School Branding & Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAssetsSubmit} className="space-y-6">
                                {assetsMessage && (
                                    <div className={cn(
                                        "p-4 rounded-lg flex items-center gap-3 text-sm border animate-in fade-in slide-in-from-top-1 duration-300",
                                        assetsMessage.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                    )}>
                                        {assetsMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        {assetsMessage.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            School Logo
                                        </label>
                                        <FileUpload
                                            type="media"
                                            currentUrl={schoolLogo}
                                            onUploadComplete={(url) => setSchoolLogo(url)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" />
                                            School Stamp
                                        </label>
                                        <FileUpload
                                            type="media"
                                            currentUrl={schoolStamp}
                                            onUploadComplete={(url) => setSchoolStamp(url)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            <PenTool className="w-3 h-3" />
                                            Director Signature
                                        </label>
                                        <FileUpload
                                            type="media"
                                            currentUrl={directorSignature}
                                            onUploadComplete={(url) => setDirectorSignature(url)}
                                        />
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 px-1 mt-1">
                                    These assets will be rendered dynamically on student result sheets. Maintain good quality and aspects ratio (Square logo, wide signature).
                                </p>

                                <button
                                    type="submit"
                                    disabled={assetsLoading}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                                >
                                    {assetsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save Assets
                                </button>
                            </form>
                        </CardContent>
                    </Card>
                </>)}
            </div>
        </div>
    );
}
