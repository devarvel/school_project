'use client';

import { useState } from 'react';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import { verifyAccessToken } from '@/actions/token-actions';

export function TokenUnlock({ resultId }: { resultId: string }) {
    const [showInput, setShowInput] = useState(false);
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async () => {
        if (token.length !== 6) {
            setError('Token must be 6 digits');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await verifyAccessToken(resultId, token);
            if (res.success) {
                // Success state will be handled by revalidation usually, 
                // but we can show a brief success message
            } else {
                setError(res.error || 'Invalid token');
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!showInput) {
        return (
            <button
                onClick={() => setShowInput(true)}
                className="text-[10px] text-slate-500 hover:text-indigo-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-1 transition-colors"
            >
                <KeyRound className="w-3 h-3" />
                Have a token?
            </button>
        );
    }

    return (
        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2">
                <input
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit token"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-bold transition-all"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Verify'}
                </button>
            </div>
            {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
            <button
                onClick={() => setShowInput(false)}
                className="text-[9px] text-slate-600 hover:text-slate-400 uppercase font-bold"
            >
                Cancel
            </button>
        </div>
    );
}
