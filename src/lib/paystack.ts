import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export const paystack = axios.create({
    baseURL: 'https://api.paystack.co',
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
});

export async function initializePaystackTransaction(data: {
    email: string;
    amount: number;
    reference?: string;
    callback_url?: string;
    metadata?: any;
}) {
    try {
        const response = await paystack.post('/transaction/initialize', {
            ...data,
            amount: data.amount * 100, // Paystack expects amount in kobo
        });
        return response.data;
    } catch (error: any) {
        console.error('Paystack Initialization Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
}

export async function verifyPaystackTransaction(reference: string) {
    try {
        const response = await paystack.get(`/transaction/verify/${reference}`);
        return response.data;
    } catch (error: any) {
        console.error('Paystack Verification Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
}
