'use server';

import connectToDatabase from '@/lib/db';
import { Settings } from '@/models/Settings';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

export async function getGlobalSettings() {
    try {
        await connectToDatabase();
        let settings = await Settings.findOne({});
        if (!settings) {
            settings = await Settings.create({ resultUnlockFee: 0 }); // Default
        }
        return {
            success: true,
            fee: settings.resultUnlockFee,
            schoolLogo: settings.schoolLogo,
            schoolStamp: settings.schoolStamp,
            directorSignature: settings.directorSignature
        };
    } catch (error) {
        console.error('Failed to get global settings:', error);
        return { success: false, error: 'Failed to fetch settings' };
    }
}

export async function updateSchoolAssets(assets: { schoolLogo?: string, schoolStamp?: string, directorSignature?: string }) {
    try {
        // Authenticate
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
            return { success: false, error: 'Unauthorized. Only Super-Admins can update global settings.' };
        }

        await connectToDatabase();

        let settings = await Settings.findOne({});
        if (settings) {
            if (assets.schoolLogo !== undefined) settings.schoolLogo = assets.schoolLogo;
            if (assets.schoolStamp !== undefined) settings.schoolStamp = assets.schoolStamp;
            if (assets.directorSignature !== undefined) settings.directorSignature = assets.directorSignature;
            await settings.save();
        } else {
            settings = await Settings.create({ resultUnlockFee: 0, ...assets });
        }

        return { success: true, message: 'School assets updated successfully.' };
    } catch (error) {
        console.error('Failed to update school assets:', error);
        return { success: false, error: 'Failed to update assets' };
    }
}

export async function updateResultUnlockFee(fee: number) {
    try {
        // Authenticate
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
            return { success: false, error: 'Unauthorized. Only Super-Admins can update global settings.' };
        }

        if (fee < 0) {
            return { success: false, error: 'Fee cannot be negative.' };
        }

        await connectToDatabase();

        let settings = await Settings.findOne({});
        if (settings) {
            settings.resultUnlockFee = fee;
            await settings.save();
        } else {
            settings = await Settings.create({ resultUnlockFee: fee });
        }

        return { success: true, message: 'Result unlock fee updated successfully.', fee: settings.resultUnlockFee };
    } catch (error) {
        console.error('Failed to update result unlock fee:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}
