'use server';

import connectToDatabase from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

/**
 * Log an admin action to the audit log.
 * Called internally by other server actions after successful operations.
 */
export async function logAction(
    action: string,
    targetType: string,
    targetId: string | undefined,
    details: string
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return; // Silently skip if no session

        await connectToDatabase();

        await AuditLog.create({
            action,
            performedBy: session.user.email || session.user.name || 'Unknown',
            performedByRole: session.user.role || 'Unknown',
            targetType,
            targetId,
            details,
        });
    } catch (error) {
        // Audit logging should never break the main flow
        console.error('[AUDIT_LOG_ERROR]', error);
    }
}

/**
 * Fetch audit logs with pagination. Super Admin only.
 */
export async function getAuditLogs(page: number = 1, limit: number = 30) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            AuditLog.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            AuditLog.countDocuments(),
        ]);

        return {
            success: true,
            logs: JSON.parse(JSON.stringify(logs)),
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
