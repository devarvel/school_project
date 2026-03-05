'use server';

import connectToDatabase from '@/lib/db';
import { Admin } from '@/models/User';
import { UserRole } from '@/types/enums';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/actions/audit-actions';

/**
 * Change password for the currently logged-in admin (Super Admin or Class Admin).
 * Both are now stored in the database with hashed passwords.
 */
export async function changePassword(currentPassword: string, newPassword: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!newPassword || newPassword.length < 8) {
        return { success: false, error: 'New password must be at least 8 characters.' };
    }

    await connectToDatabase();

    try {
        const admin = await Admin.findOne({ email: session.user.email });
        if (!admin) {
            return { success: false, error: 'Admin account not found.' };
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, admin.password || '');
        if (!isValid) {
            return { success: false, error: 'Current password is incorrect.' };
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();

        await logAction('CHANGE_PASSWORD', 'Admin', admin._id.toString(), `Password changed for ${admin.email}`);

        return { success: true, message: 'Password changed successfully.' };
    } catch (error: any) {
        console.error('[CHANGE_PASSWORD_ERROR]', error);
        return { success: false, error: 'Failed to change password. Please try again.' };
    }
}
