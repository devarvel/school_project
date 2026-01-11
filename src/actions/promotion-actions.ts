'use server';

import connectToDatabase from '@/lib/db';
import { Student, StudentStatus } from '@/models/User';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';
import { FINAL_LEVEL } from '@/lib/constants';

/**
 * Mass Promotion Engine
 * Promotes all active students by 1 level.
 * Students in 'failedStudentIds' will mark as repeaters.
 * Final year students (SS 3 / Level 11) will be archived.
 */
export async function processSessionEndPromotion(failedStudentIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        // 1. Mark Repeaters (Those who failed)
        if (failedStudentIds.length > 0) {
            await Student.updateMany(
                { _id: { $in: failedStudentIds } },
                { $set: { isRepeat: true } }
            );
        }

        // 2. Archive Final Year Students (Level 11) who PASSED
        await Student.updateMany(
            {
                currentLevel: FINAL_LEVEL,
                _id: { $nin: failedStudentIds },
                status: StudentStatus.ACTIVE
            },
            { $set: { status: StudentStatus.ARCHIVED } }
        );

        // 3. Promote Others (Level < 11) who PASSED
        await Student.updateMany(
            {
                currentLevel: { $lt: FINAL_LEVEL },
                _id: { $nin: failedStudentIds },
                status: StudentStatus.ACTIVE
            },
            {
                $inc: { currentLevel: 1 },
                $set: { isRepeat: false }
            }
        );

        revalidatePath('/admin/dashboard');
        revalidatePath('/admin/promotion');

        return { success: true, message: 'Mass promotion completed successfully.' };
    } catch (error: any) {
        console.error('Promotion Error:', error);
        return { success: false, error: error.message };
    }
}
