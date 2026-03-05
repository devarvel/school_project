'use server';

import connectToDatabase from '@/lib/db';
import { Admin, UserRole } from '@/models/User';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { AdminSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAction } from '@/actions/audit-actions';
import { AuditLog } from '@/models/AuditLog';
import { Student, StudentStatus } from '@/models/User';
import { Result } from '@/models/Result';
import { BlogPost } from '@/models/BlogPost';
import mongoose from 'mongoose';


export async function createClassAdmin(formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = AdminSchema.parse(formData);

        // Check for existing email
        const existingEmail = await Admin.findOne({ email: validatedData.email });
        if (existingEmail) {
            return { success: false, error: 'An account with this email already exists.' };
        }

        // Check if a class admin is already assigned to this level
        const existingClassAdmin = await Admin.findOne({
            role: UserRole.CLASS_ADMIN,
            assignedLevel: validatedData.assignedLevel
        });

        if (existingClassAdmin) {
            return {
                success: false,
                error: `This class (Level ${validatedData.assignedLevel}) is already assigned to ${existingClassAdmin.email}.`
            };
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const admin = await Admin.create({
            email: validatedData.email,
            password: hashedPassword,
            role: UserRole.CLASS_ADMIN,
            assignedLevel: validatedData.assignedLevel,
        });

        await logAction('CREATE_ADMIN', 'Admin', admin._id.toString(), `Created Class Admin: ${admin.email}`);

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

        await logAction('DELETE_ADMIN', 'Admin', id, `Deleted admin account`);

        revalidatePath('/admin/users');

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function resetAdminPassword(id: string, newPassword: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    if (!newPassword || newPassword.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    await connectToDatabase();
    try {
        const admin = await Admin.findById(id);
        if (!admin) return { success: false, error: 'Admin not found.' };

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();

        await logAction('RESET_PASSWORD', 'Admin', id, `Reset password for admin: ${admin.email}`);

        revalidatePath('/admin/users');
        return { success: true, message: 'Password reset successfully' };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getSystemUsage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        // 1. Database Stats
        if (!mongoose.connection.db) {
            console.error('Database connection not established');
            return {
                success: true,
                usage: {
                    database: { usedMB: 0, storageMB: 0, limitMB: 512 },
                    students: { current: 0, total: 0, limit: 500 },
                    assets: { count: 0, limit: 1000 },
                    auditLogs: 0
                }
            };
        }
        const stats = await mongoose.connection.db.command({ dbStats: 1 });
        const dataSizeMB = (stats.dataSize || 0) / (1024 * 1024);
        const storageSizeMB = (stats.storageSize || 0) / (1024 * 1024);

        // 2. Student Capacity
        const activeStudents = await Student.countDocuments({ status: StudentStatus.ACTIVE });
        const totalStudents = await Student.countDocuments();

        // 3. Cloudinary Assets (Estimates)
        const totalResults = await Result.countDocuments();
        const postsWithImages = await BlogPost.countDocuments({ imageHeader: { $exists: true, $ne: '' } });
        // Assuming 1 logo, 1 stamp, 1 signature + some results/images
        const estimatedAssets = totalResults + postsWithImages + 3;

        // 4. Audit Log Count
        const auditLogCount = await AuditLog.countDocuments();

        return {
            success: true,
            usage: {
                database: {
                    usedMB: Math.round(dataSizeMB * 100) / 100,
                    storageMB: Math.round(storageSizeMB * 100) / 100,
                    limitMB: 512, // Free Tier Soft Limit
                },
                students: {
                    current: activeStudents,
                    total: totalStudents,
                    limit: 500, // Soft Limit
                },
                assets: {
                    count: estimatedAssets,
                    limit: 1000, // Soft Limit
                },
                auditLogs: auditLogCount
            }
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function purgeAuditLogs() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const count = await AuditLog.countDocuments();
        await AuditLog.deleteMany({});

        await logAction('PURGE_AUDIT_LOGS', 'System', undefined, `Purged ${count} audit logs.`);

        revalidatePath('/admin/dashboard');
        return { success: true, message: `Successfully purged ${count} logs.` };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
