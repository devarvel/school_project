import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { Student, StudentStatus } from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    let currentLevel = level ? parseInt(level) : null;

    // Enforce level restriction for CLASS_ADMIN
    if (session.user.role === UserRole.CLASS_ADMIN) {
        currentLevel = session.user.assignedLevel;
    }

    await connectToDatabase();

    const query: any = { status: StudentStatus.ACTIVE };
    if (currentLevel !== null) {
        query.currentLevel = currentLevel;
    }

    const students = await Student.find(query).sort({ currentLevel: 1, surname: 1 });

    return NextResponse.json(students);
}
