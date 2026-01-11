'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { createBlogPost, updateBlogPost } from '@/actions/blog-actions';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';

interface BlogFormProps {
    initialData?: {
        _id: string;
        title: string;
        excerpt: string;
        content: string;
        imageHeader?: string;
        published: boolean;
    };
}

export function BlogForm({ initialData }: BlogFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [imageHeaderUrl, setImageHeaderUrl] = useState(initialData?.imageHeader || '');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        // Handle checkbox
        const payload = {
            ...data,
            published: formData.get('published') === 'on'
        };

        const res = initialData
            ? await updateBlogPost(initialData._id, payload)
            : await createBlogPost(payload);

        setLoading(false);

        if (res.success) {
            router.push('/admin/blog');
            router.refresh();
        } else {
            alert('Error: ' + res.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Article Title</label>
                        <input
                            required
                            name="title"
                            defaultValue={initialData?.title}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="e.g., Annual Sports Day 2026"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Short Excerpt</label>
                        <textarea
                            required
                            name="excerpt"
                            defaultValue={initialData?.excerpt}
                            rows={2}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                            placeholder="A brief summary for the preview card..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Content (Markdown/HTML Support)</label>
                        <textarea
                            required
                            name="content"
                            defaultValue={initialData?.content}
                            rows={10}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="Write your article here..."
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-400" />
                                Header Media (Image or Video)
                            </label>
                            <FileUpload
                                type="media"
                                currentUrl={imageHeaderUrl}
                                onUploadComplete={(url) => setImageHeaderUrl(url)}
                            />
                            <input type="hidden" name="imageHeader" value={imageHeaderUrl} />
                        </div>

                        <div className="flex items-center gap-3 pt-8">
                            <input
                                type="checkbox"
                                name="published"
                                id="published"
                                defaultChecked={initialData?.published}
                                className="w-5 h-5 accent-indigo-500"
                            />
                            <label htmlFor="published" className="text-sm font-medium text-slate-300 cursor-pointer">
                                Publish immediately
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {initialData ? 'Update Article' : 'Save Article'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
