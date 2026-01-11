'use server';

import connectToDatabase from '@/lib/db';
import { Student, StudentStatus } from '@/models/User';
import { revalidatePath } from 'next/cache';
import { StudentSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

export async function createStudent(formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = StudentSchema.parse(formData);

        // Safety check: Class admins can only create students for their assigned level
        if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== undefined && validatedData.currentLevel !== session.user.assignedLevel) {
            return { success: false, error: 'Cannot create student for a different level' };
        }

        const student = await Student.create({
            ...validatedData,
            status: StudentStatus.ACTIVE,
            isRepeat: false,
        });
        revalidatePath('/admin/students');
        return { success: true, student: JSON.parse(JSON.stringify(student)) };
    } catch (err: any) {
        if (err.code === 11000) {
            return { success: false, error: 'Admission Number already exists' };
        }
        return { success: false, error: err.message || 'Validation failed' };
    }
}

import { Result } from '@/models/Result';
import { Payment } from '@/models/Payment';

export async function deleteStudent(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const student = await Student.findById(id);
        if (!student) return { success: false, error: 'Student not found' };

        // Security check for class admin
        if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== undefined && student.currentLevel !== session.user.assignedLevel) {
            return { success: false, error: 'Unauthorized: Student belongs to another class' };
        }

        // 1. Delete associated Results
        await Result.deleteMany({ studentId: id });

        // 2. Delete associated Payments
        await Payment.deleteMany({ studentId: id });

        // 3. Delete Student record
        await Student.findByIdAndDelete(id);

        revalidatePath('/admin/students');
        revalidatePath('/admin/dashboard');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
