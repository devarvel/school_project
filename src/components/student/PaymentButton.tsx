'use client';

import { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { initializeResultPayment } from '@/actions/payment-actions';

export function PaymentButton({ resultId }: { resultId: string }) {
    const [loading, setLoading] = useState(false);

    const handleUnlock = async () => {
        setLoading(true);
        try {
            const res = await initializeResultPayment(resultId);
            if (res.success && res.url) {
                window.location.href = res.url;
            } else {
                alert('Failed to initialize payment. Please try again.');
                setLoading(false);
            }
        } catch (error: any) {
            alert(error.message || 'An error occurred');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleUnlock}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20 group"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            {loading ? 'Initializing...' : 'Unlock Now'}
        </button>
    );
}
