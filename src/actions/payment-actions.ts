'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Result } from "@/models/Result";
import { Student } from "@/models/User";
import { initializePaystackTransaction } from "@/lib/paystack";
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
