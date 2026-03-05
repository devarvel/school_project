'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteAdmin } from '@/actions/admin-actions';
import { cn } from '@/lib/utils';

interface DeleteAdminButtonProps {
    adminId: string;
}

export function DeleteAdminButton({ adminId }: DeleteAdminButtonProps) {
    const [deleting, setDeleting] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);

    const handleDelete = async () => {
        if (!confirmStep) {
            setConfirmStep(true);
            setTimeout(() => setConfirmStep(false), 3000); // Reset after 3 seconds
            return;
        }

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
            className={cn(
                "p-2 rounded-lg transition-all flex items-center gap-2",
                confirmStep ? "bg-red-500/20 text-red-400 px-3 ring-1 ring-red-500/30" : "text-slate-500 hover:text-red-400 hover:bg-slate-800"
            )}
            title={confirmStep ? "Confirm Delete" : "Delete Admin"}
        >
            {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : confirmStep ? (
                <>
                    <Trash2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Confirm Delete?</span>
                </>
            ) : (
                <Trash2 className="w-5 h-5" />
            )}
        </button>
    );
}
