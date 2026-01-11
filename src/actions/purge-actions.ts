'use server';

import connectToDatabase from '@/lib/db';
import { Student } from '@/models/User';
import { Result } from '@/models/Result';
import { Payment } from '@/models/Payment';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

/**
 * Cascade Purge System
 * Deletes student and all associated records (Results, Payments)
 */
export async function cascadeDeleteStudent(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        // 1. Delete associated Results
        await Result.deleteMany({ studentId });

        // 2. Delete associated Payments
        await Payment.deleteMany({ studentId });

        // 3. Delete Student record
        await Student.findByIdAndDelete(studentId);

        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Purge Entire Level (Archive or Delete)
 * For MVP, we'll implement a "Purge Level" action
 */
export async function purgeLevel(level: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const students = await Student.find({ currentLevel: level });
        const ids = students.map(s => s._id);

        await Result.deleteMany({ studentId: { $in: ids } });
        await Payment.deleteMany({ studentId: { $in: ids } });
        await Student.deleteMany({ _id: { $in: ids } });

        revalidatePath('/admin/dashboard');
        return { success: true, count: ids.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
