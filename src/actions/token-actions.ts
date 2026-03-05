'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Result } from "@/models/Result";
import { UserRole } from "@/types/enums";
import { revalidatePath } from "next/cache";
import { tokenRateLimit } from "@/lib/rate-limit";

export async function verifyAccessToken(resultId: string, token: string) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.STUDENT) {
        throw new Error('Unauthorized');
    }

    // Rate limit token attempts by user ID
    const rateCheck = tokenRateLimit(session.user.id);
    if (!rateCheck.success) {
        throw new Error('Too many attempts. Please wait a minute and try again.');
    }

    await connectToDatabase();

    const result = await Result.findById(resultId);
    if (!result) throw new Error('Result not found');
    if (result.isPaid) throw new Error('Result already unlocked');

    // Check token expiry
    if (result.accessTokenExpiresAt && new Date() > result.accessTokenExpiresAt) {
        return { success: false, error: 'Access token has expired. Please request a new one.' };
    }

    if (result.accessToken === token) {
        result.isPaid = true;
        result.accessTokenUsed = true;
        await result.save();

        revalidatePath('/student');
        return { success: true };
    } else {
        return { success: false, error: 'Invalid or expired access token' };
    }
}
