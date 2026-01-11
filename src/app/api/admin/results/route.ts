import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Result } from '@/models/Result';
import { Student } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
        return new NextResponse('Student ID required', { status: 400 });
    }

    await connectToDatabase();

    // For CLASS_ADMIN, we must verify the student belongs to their level
    if (session.user.role === UserRole.CLASS_ADMIN) {
        const student = await Student.findById(studentId);
        if (!student || student.currentLevel !== session.user.assignedLevel) {
            return new NextResponse('Unauthorized: Student belongs to another level', { status: 403 });
        }
    }

    const results = await Result.find({ studentId }).sort({ createdAt: -1 });

    return NextResponse.json(results);
}
