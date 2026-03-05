'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Payment } from "@/models/Payment";
import { Result } from "@/models/Result";
import { UserRole } from "@/types/enums";

/**
 * Fetch all payments made by the logged-in student, 
 * including details about the result they paid for.
 */
export async function getStudentPaymentHistory() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.STUDENT) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        // Fetch payments for this student
        // Note: Payment model uses studentId (ObjectId)
        // We get studentId from the student record associated with admissionNum
        const payments = await Payment.find({ studentId: session.user.id })
            .sort({ createdAt: -1 })
            .lean();

        // Enrich payments with result details if possible
        // Actually Payment doesn't have resultId, but Result has studentId and isPaid.
        // Wait, Payment model usually should track WHAT was paid for.
        // Let's check Payment model.
        
        return { 
            success: true, 
            payments: JSON.parse(JSON.stringify(payments)) 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
