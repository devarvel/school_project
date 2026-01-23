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

export async function updateStudent(id: string, formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        // We use Partial to allow updating subset, but here we validate full schema or simple partial
        // For simplicity, we just parse what we can or validate specific fields.
        // Let's re-use StudentSchema but make it partial safe or manually extracting
        // Actually, StudentSchema requires admissionNum which we might not want to change easily or at all?
        // Let's assume we pass all data again.

        const validatedData = StudentSchema.parse(formData);

        const student = await Student.findById(id);
        if (!student) return { success: false, error: 'Student not found' };

        // Security check for class admin
        if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== undefined && student.currentLevel !== session.user.assignedLevel) {
            return { success: false, error: 'Unauthorized: Student belongs to another class' };
        }

        // Check if admission number is being changed to one that exists
        if (validatedData.admissionNum !== student.admissionNum) {
            const exists = await Student.findOne({ admissionNum: validatedData.admissionNum });
            if (exists) return { success: false, error: 'Admission Number already exists' };
        }

        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            { ...validatedData },
            { new: true }
        );

        revalidatePath('/admin/students');
        return { success: true, student: JSON.parse(JSON.stringify(updatedStudent)) };
    } catch (err: any) {
        return { success: false, error: err.message || 'Update failed' };
    }
}

export async function bulkCreateStudents(studentsData: any[]) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    let successCount = 0;
    let errors: string[] = [];

    // Safety check for class admin
    const allowedLevel = (session.user.role === UserRole.CLASS_ADMIN) ? session.user.assignedLevel : null;

    for (const data of studentsData) {
        try {
            // Force level if class admin
            if (allowedLevel !== undefined && allowedLevel !== null) {
                data.currentLevel = allowedLevel;
            }

            const validatedData = StudentSchema.parse(data);

            await Student.create({
                ...validatedData,
                status: StudentStatus.ACTIVE,
                isRepeat: false,
            });
            successCount++;
        } catch (err: any) {
            // If duplicate key error (E11000), skip or log
            if (err.code === 11000) {
                errors.push(`Duplicate: ${data.admissionNum}`);
            } else if (err.issues) {
                errors.push(`Validation Error (${data.surname}): ${err.issues[0].message}`);
            } else {
                errors.push(`Error (${data.admissionNum}): ${err.message}`);
            }
        }
    }

    revalidatePath('/admin/students');
    return { success: true, count: successCount, errors };
}
