'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, ImageIcon, Film, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    onUploadComplete: (url: string) => void;
    currentUrl?: string;
    type: 'media' | 'document';
    className?: string;
}

export function FileUpload({ onUploadComplete, currentUrl, type, className }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const handleFileUpload = async (file: File) => {
        // Validation
        if (type === 'media') {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                alert('Please upload an image or video file.');
                return;
            }
        } else {
            if (file.type !== 'application/pdf' && !file.type.includes('msword') && !file.type.includes('openxmlformats-officedocument')) {
                alert('Please upload a document (PDF/Word).');
                return;
            }
        }

        setUploading(true);

        // Select preset based on file type from the new ENV variables
        let uploadPreset = '';
        if (file.type.startsWith('image/')) {
            uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_PRESET || '';
        } else if (file.type.startsWith('video/')) {
            uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_PRESET || '';
        } else if (type === 'document') {
            uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PDF_PRESET || '';
        }

        if (!uploadPreset) {
            console.error('Missing Cloudinary Preset for type:', file.type);
            alert('Upload configuration missing. Please check your presets.');
            setUploading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) throw new Error('Cloudinary Cloud Name is not configured');

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            if (data.secure_url) {
                setPreview(data.secure_url);
                onUploadComplete(data.secure_url);
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setPreview(null);
        onUploadComplete('');
    };

    return (
        <div className={cn("space-y-4", className)}>
            {!preview ? (
                <div
                    className={cn(
                        "relative group cursor-pointer border-2 border-dashed rounded-xl transition-all duration-200 p-8 flex flex-col items-center justify-center gap-4 min-h-[160px]",
                        dragActive ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]" : "border-slate-700 hover:border-slate-500 bg-slate-950/50",
                        uploading && "opacity-50 pointer-events-none"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept={type === 'media' ? "image/*,video/*" : ".pdf,.doc,.docx"}
                        onChange={handleChange}
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                            <p className="text-sm font-medium text-slate-400 italic">Uploading to Cloud...</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 rounded-full bg-slate-900 border border-slate-800 group-hover:border-indigo-500/50 transition-colors">
                                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-slate-200">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {type === 'media' ? 'Images and Videos (Max 10MB)' : 'Documents: PDF, Word (Max 5MB)'}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {type === 'media' ? (
                                preview.includes('.mp4') || preview.includes('.mov') ? (
                                    <Film className="w-8 h-8 text-indigo-400" />
                                ) : (
                                    <img src={preview} alt="Upload preview" className="w-full h-full object-cover" />
                                )
                            ) : (
                                <FileText className="w-8 h-8 text-indigo-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate italic">{preview}</p>
                            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                                <span className="block w-2 h-2 rounded-full bg-emerald-500" />
                                Ready for use
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={removeFile}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
