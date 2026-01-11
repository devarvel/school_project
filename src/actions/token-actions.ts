'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import { Result } from "@/models/Result";
import { UserRole } from "@/types/enums";
import { revalidatePath } from "next/cache";

export async function verifyAccessToken(resultId: string, token: string) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== UserRole.STUDENT) {
        throw new Error('Unauthorized');
    }

    await connectToDatabase();

    const result = await Result.findById(resultId);
    if (!result) throw new Error('Result not found');
    if (result.isPaid) throw new Error('Result already unlocked');

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
