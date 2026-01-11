'use server';

import connectToDatabase from '@/lib/db';
import { Admin, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { AdminSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function createClassAdmin(formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = AdminSchema.parse(formData);
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        await Admin.create({
            email: validatedData.email,
            password: hashedPassword,
            role: UserRole.CLASS_ADMIN,
            assignedLevel: validatedData.assignedLevel,
        });
        revalidatePath('/admin/users');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || 'Validation failed' };
    }
}

export async function deleteAdmin(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        await Admin.findByIdAndDelete(id);
        revalidatePath('/admin/users');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
