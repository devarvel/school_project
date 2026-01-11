'use server';

import connectToDatabase from '@/lib/db';
import { Result } from '@/models/Result';
import { revalidatePath } from 'next/cache';
import { ResultSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

export async function uploadResultRecord(formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = ResultSchema.parse(formData);

        const result = await Result.create({
            ...validatedData,
            isPaid: false,
            accessTokenUsed: false,
        });
        revalidatePath('/admin/students');
        return { success: true, result: JSON.parse(JSON.stringify(result)) };
    } catch (err: any) {
        if (err.code === 11000) {
            return { success: false, error: 'Result for this term/session already exists for this student.' };
        }
        return { success: false, error: err.message || 'Validation failed' };
    }
}

export async function deleteResult(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        if (session.user.role === UserRole.CLASS_ADMIN) {
            // Further security: Check if student belongs to this admin's level
            const result = await Result.findById(id).populate('studentId');
            if (!result || (session.user.assignedLevel !== undefined && (result.studentId as any).currentLevel !== session.user.assignedLevel)) {
                return { success: false, error: 'Unauthorized: Cannot delete result for student in another level' };
            }
        }

        await Result.findByIdAndDelete(id);
        revalidatePath('/admin/students');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
