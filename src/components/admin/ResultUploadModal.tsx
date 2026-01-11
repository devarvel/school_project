'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, FileText, Upload, CheckCircle2, File as FileIcon, Loader2 } from 'lucide-react';
import { uploadResultRecord } from '@/actions/result-actions';
import { FileUpload } from '@/components/ui/FileUpload';
import { cn } from '@/lib/utils';

interface UploadModalProps {
    student: { _id: string, surname: string, admissionNum: string };
    onClose: () => void;
    onSuccess: () => void;
}

export function ResultUploadModal({ student, onClose, onSuccess }: UploadModalProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        // In a real app, we would upload to Cloudinary here first
        // const file = formData.get('pdf') as File;
        // const cloudinaryUrl = await uploadToCloudinary(file);

        // For MVP/Demo: use a placeholder or manual URL input
        const data = {
            studentId: student._id,
            term: formData.get('term') as string,
            session: formData.get('session') as string,
            pdfUrl: formData.get('pdfUrl') as string || 'https://res.cloudinary.com/demo/image/upload/sample_result.pdf',
        };

        const res = await uploadResultRecord(data);
        setLoading(false);

        if (res.success) {
            setSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1500);
        } else {
            alert(res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Upload Result</CardTitle>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                        <p className="text-sm font-medium text-slate-300">
                            Student: <span className="text-white">{student.surname}</span>
                            <span className="text-xs text-slate-400 ml-2">({student.admissionNum})</span>
                        </p>
                    </div>

                    {success ? (
                        <div className="py-12 flex flex-col items-center justify-center text-emerald-400 gap-4">
                            <CheckCircle2 className="w-16 h-16" />
                            <p className="font-bold text-lg">Result Uploaded!</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Academic Session</label>
                                    <input name="session" required className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" placeholder="2025/2026" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Term</label>
                                    <select name="term" required className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white">
                                        <option value="First">First Term</option>
                                        <option value="Second">Second Term</option>
                                        <option value="Third">Third Term</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <FileIcon className="w-3.5 h-3.5 text-indigo-400" />
                                    Result Document (PDF/Word)
                                </label>
                                <FileUpload
                                    type="document"
                                    currentUrl={pdfUrl}
                                    onUploadComplete={(url) => setPdfUrl(url)}
                                />
                                <input type="hidden" name="pdfUrl" value={pdfUrl} />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 text-slate-400 font-bold hover:bg-slate-800 rounded transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                                    Save Record
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

