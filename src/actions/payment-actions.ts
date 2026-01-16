'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Result } from "@/models/Result";
import { Payment } from "@/models/Payment";
import { Student } from "@/models/User";
import { initializePaystackTransaction, verifyPaystackTransaction } from "@/lib/paystack";
import { UserRole } from "@/types/enums";

/**
 * Initialize Payment for a Result
 * Returns Paystack authorization URL
 */
export async function initializeResultPayment(resultId: string) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.STUDENT) {
        throw new Error('Unauthorized');
    }

    await connectToDatabase();

    const result = await Result.findById(resultId);
    if (!result) throw new Error('Result not found');
    if (result.isPaid) throw new Error('Result already unlocked');

    const student = await Student.findOne({ admissionNum: session.user.admissionNum });
    if (!student) throw new Error('Student profile not found');

    // Business Logic: Fixed price for result access (e.g., 2000 NGN)
    const amount = 2000;

    const metadata = {
        resultId: result._id.toString(),
        studentId: student._id.toString(),
        admissionNum: student.admissionNum,
        session: result.session,
        term: result.term,
    };

    const response = await initializePaystackTransaction({
        email: `${student.admissionNum}@scholarportal.pro`, // Dummy email for student if real one doesn't exist
        amount,
        metadata,
        callback_url: `${process.env.NEXTAUTH_URL}/student`,
    });

    return { success: true, url: response.data.authorization_url, reference: response.data.reference };
}

/**
 * Verify Payment and Unlock Result
 */
export async function verifyPayment(reference: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.STUDENT) {
        throw new Error('Unauthorized');
    }

    await connectToDatabase();

    // 1. Check if record already unlocked (Idempotency)
    const existingPayment = await Payment.findOne({ reference });
    if (existingPayment) {
        return { success: true, message: 'Already processed' };
    }

    // 2. Verify with Paystack
    const verification = await verifyPaystackTransaction(reference);

    if (verification.status && verification.data.status === 'success') {
        const { resultId, studentId } = verification.data.metadata;

        // 3. Update Result
        const accessToken = Math.floor(100000 + Math.random() * 900000).toString();
        await Result.findByIdAndUpdate(resultId, {
            isPaid: true,
            accessToken,
            accessTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // 4. Create Payment Record
        const student = await Student.findById(studentId);
        if (!student) throw new Error('Student not found');

        await Payment.create({
            studentId: student._id,
            amount: verification.data.amount / 100,
            reference: reference,
            classAtTimeOfPayment: student.currentLevel,
        });

        return { success: true, message: 'Result unlocked successfully' };
    }

    return { success: false, message: 'Payment verification failed' };
}
