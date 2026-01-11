'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteAdmin } from '@/actions/admin-actions';

interface DeleteAdminButtonProps {
    adminId: string;
}

export function DeleteAdminButton({ adminId }: DeleteAdminButtonProps) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this admin?')) return;

        setDeleting(true);
        const res = await deleteAdmin(adminId);
        setDeleting(false);

        if (!res.success) {
            alert(res.error || 'Failed to delete admin');
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
            title="Delete Admin"
        >
            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
        </button>
    );
}
