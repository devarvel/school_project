'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/actions/payment-actions';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function PaymentVerification() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reference = searchParams.get('reference');
    const [verifying, setVerifying] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const effectRan = useRef(false);

    useEffect(() => {
        // Prevent double execution in Strict Mode
        if (effectRan.current) return;

        async function handleVerification() {
            if (!reference) return;

            setVerifying(true);
            try {
                const result = await verifyPayment(reference);
                if (result.success) {
                    setStatus('success');
                    setMessage(result.message || 'Payment verified!');
                    // Refresh current page to reflect unlocked state
                    setTimeout(() => {
                        router.refresh();
                        // Clear the reference from URL without full reload
                        const params = new URLSearchParams(window.location.search);
                        params.delete('reference');
                        params.delete('trl'); // Some gateways include trl
                        const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
                        window.history.replaceState({}, '', newUrl);
                        setVerifying(false);
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(result.message || 'Verification failed.');
                    setVerifying(false);
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'An error occurred during verification.');
                setVerifying(false);
            }
        }

        if (reference) {
            handleVerification();
            effectRan.current = true;
        }
    }, [reference, router]);

    if (!reference || (!verifying && status === 'idle')) return null;

    return (
        <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4 animate-in slide-in-from-top-full duration-500">
            <div className={`
                max-w-md w-full p-4 rounded-xl border shadow-2xl flex items-center gap-4
                ${status === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-400' :
                    status === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-400' :
                        'bg-indigo-950/90 border-indigo-500/50 text-indigo-400'}
                backdrop-blur-md
            `}>
                {status === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                ) : status === 'error' ? (
                    <XCircle className="w-6 h-6 flex-shrink-0" />
                ) : (
                    <Loader2 className="w-6 h-6 animate-spin flex-shrink-0" />
                )}

                <div className="flex-1">
                    <p className="text-sm font-bold">
                        {verifying ? 'Verifying Payment...' :
                            status === 'success' ? 'Successfully Unlocked!' : 'Payment Issue'}
                    </p>
                    <p className="text-xs opacity-80">{message || 'Please wait while we confirm your transaction.'}</p>
                </div>
            </div>
        </div>
    );
}
