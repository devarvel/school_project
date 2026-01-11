'use client';

import { useState } from 'react';
import { Trash2, Edit, Loader2 } from 'lucide-react';
import { deleteBlogPost } from '@/actions/blog-actions';
import { useRouter } from 'next/navigation';

interface BlogActionsProps {
    postId: string;
}

export function BlogActions({ postId }: BlogActionsProps) {
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this article?')) return;

        setDeleting(true);
        const res = await deleteBlogPost(postId);
        setDeleting(false);

        if (!res.success) {
            alert(res.error || 'Failed to delete post');
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => router.push(`/admin/blog/${postId}/edit`)}
                className="p-2 text-slate-400 hover:text-indigo-400 transition-colors"
                title="Edit Article"
            >
                <Edit className="w-5 h-5" />
            </button>
            <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-slate-400 hover:text-red-400 transition-colors disabled:opacity-50"
                title="Delete Article"
            >
                {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
        </div>
    );
}
