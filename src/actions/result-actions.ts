'use server';

import connectToDatabase from '@/lib/db';
import { Result } from '@/models/Result';
import { revalidatePath } from 'next/cache';
import { ResultSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@/types/enums';
import { logAction } from '@/actions/audit-actions';


export async function uploadResultRecord(formData: any) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        const validatedData = ResultSchema.parse(formData);

        const result = await Result.create({
            ...validatedData,
            isPaid: false,
            accessTokenUsed: false,
        });

        await logAction('UPLOAD_RESULT', 'Result', result._id.toString(), `Uploaded result for student ${result.studentId} (${result.term} Term, ${result.session})`);

        revalidatePath('/admin/students');

        return { success: true, result: JSON.parse(JSON.stringify(result)) };
    } catch (err: any) {
        if (err.code === 11000) {
            return { success: false, error: 'Result for this term/session already exists for this student.' };
        }
        return { success: false, error: err.message || 'Validation failed' };
    }
}

export async function deleteResult(id: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();
    try {
        if (session.user.role === UserRole.CLASS_ADMIN) {
            // Further security: Check if student belongs to this admin's level
            const result = await Result.findById(id).populate('studentId');
            if (!result || (session.user.assignedLevel !== undefined && (result.studentId as any).currentLevel !== session.user.assignedLevel)) {
                return { success: false, error: 'Unauthorized: Cannot delete result for student in another level' };
            }
        }

        await Result.findByIdAndDelete(id);

        await logAction('DELETE_RESULT', 'Result', id, `Deleted result record`);

        revalidatePath('/admin/students');

        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

import { Student } from '@/models/User';

export async function getStudentsForScoring(level: number, term: string, sessionStr: string, subject: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== level) {
        return { success: false, error: 'Unauthorized: Cannot access students outside your assigned level' };
    }

    await connectToDatabase();

    try {
        const students = await Student.find({ currentLevel: level, status: 'Active' }).sort({ surname: 1, firstName: 1 }).lean();

        const studentIds = students.map(s => s._id);
        const results = await Result.find({
            studentId: { $in: studentIds },
            term,
            session: sessionStr
        }).lean();

        const resultMap = new Map();
        for (const res of results) {
            const score = (res.scores || []).find((s: any) => s.subject === subject);
            resultMap.set(res.studentId.toString(), {
                ca: score?.ca ?? '',
                exam: score?.exam ?? '',
                classTeacherRemark: res.classTeacherRemark ?? '',
            });
        }

        const data = students.map((s: any) => ({
            _id: s._id.toString(),
            admissionNum: s.admissionNum,
            name: `${s.surname} ${s.firstName || ''} ${s.otherNames || ''}`.trim(),
            existingScore: resultMap.get(s._id.toString()) || { ca: '', exam: '', classTeacherRemark: '' }
        }));

        return { success: true, students: data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

function calculateGradeAndRemark(total: number) {
    if (total >= 80) return { grade: 'A', remark: 'Excellent' };
    if (total >= 70) return { grade: 'B', remark: 'Very Good' };
    if (total >= 60) return { grade: 'C', remark: 'Good' };
    if (total >= 50) return { grade: 'D', remark: 'Average' };
    if (total >= 40) return { grade: 'E', remark: 'Pass' };
    return { grade: 'F', remark: 'Fail' };
}

export async function saveClassScores(level: number, term: string, sessionStr: string, subject: string, scoresData: any[]) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== level) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        for (const data of scoresData) {
            // Check if both fields are completely empty string to skip. If 0, we still save it.
            if (data.ca === '' && data.exam === '') continue;

            const ca = Number(data.ca) || 0;
            const exam = Number(data.exam) || 0;
            const total = ca + exam;
            const { grade, remark } = calculateGradeAndRemark(total);

            const scoreObj = { subject, ca, exam, total, grade, remark };

            const result = await Result.findOne({ studentId: data.studentId, term, session: sessionStr });

            if (result) {
                const scoreIndex = result.scores.findIndex((s: any) => s.subject === subject);
                if (scoreIndex > -1) {
                    result.scores[scoreIndex] = scoreObj;
                } else {
                    result.scores.push(scoreObj);
                }

                if (data.classTeacherRemark) {
                    // Overwrite classTeacherRemark (might affect remarks from other subjects if not careful, 
                    // but usually class teacher sets the final remark, or it's cumulative)
                    result.classTeacherRemark = data.classTeacherRemark;
                }

                await result.save();
            } else {
                await Result.create({
                    studentId: data.studentId,
                    term,
                    session: sessionStr,
                    scores: [scoreObj],
                    classTeacherRemark: data.classTeacherRemark || '',
                    isPaid: false,
                    accessTokenUsed: false
                });
            }
        }

        await logAction('UPDATE_SCORES', 'Result', undefined, `Updated ${subject} scores for Level ${level} (${term} Term, ${sessionStr})`);

        return { success: true, message: 'Scores saved successfully.' };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getStudentResultWithRank(studentId: string, term: string, sessionStr: string) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        const student = await Student.findById(studentId);
        if (!student) return { success: false, error: 'Student not found' };

        // Fetch the target result
        const targetResult = await Result.findOne({ studentId, term, session: sessionStr }).lean();
        if (!targetResult) return { success: false, error: 'Result not found for this term and session' };

        // Position logic
        const position = targetResult.position || '-';

        const targetSumTotal = (targetResult.scores || []).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
        const totalPossible = (targetResult.scores?.length || 0) * 100;
        const average = (targetResult.scores?.length || 0) > 0 ? (targetSumTotal / targetResult.scores!.length).toFixed(1) : '0';

        // Assuming totalStudents could be found by counting all students in this class
        const totalStudents = await Result.countDocuments({ term, session: sessionStr, studentId: { $in: (await Student.find({ currentLevel: student.currentLevel }, '_id').lean()).map(s => s._id) } });

        return {
            success: true,
            result: JSON.parse(JSON.stringify(targetResult)),
            student: JSON.parse(JSON.stringify(student)),
            stats: {
                position: position,
                totalStudents: totalStudents,
                totalScore: targetSumTotal,
                totalPossible,
                average
            }
        };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function calculateClassRanks(level: number, term: string, sessionStr: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== level) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        const students = await Student.find({ currentLevel: level }).select('_id').lean();
        const studentIds = students.map(s => s._id);

        const results = await Result.find({ studentId: { $in: studentIds }, term, session: sessionStr });

        const resultScores = results.map(res => {
            const sumTotal = (res.scores || []).reduce((acc: number, curr: any) => acc + (curr.total || 0), 0);
            return {
                resultId: res._id,
                sumTotal
            };
        });

        // Group by total score
        const scoreGroups: Record<number, any[]> = {};
        for (const item of resultScores) {
            if (!scoreGroups[item.sumTotal]) {
                scoreGroups[item.sumTotal] = [];
            }
            scoreGroups[item.sumTotal].push(item.resultId);
        }

        // Sort unique scores descending
        const uniqueScores = Object.keys(scoreGroups).map(Number).sort((a, b) => b - a);

        let currentRank = 1;
        const getPositionWithSuffix = (n: number) => {
            const j = n % 10, k = n % 100;
            if (j == 1 && k != 11) return n + "st";
            if (j == 2 && k != 12) return n + "nd";
            if (j == 3 && k != 13) return n + "rd";
            return n + "th";
        };

        for (const score of uniqueScores) {
            const idsWithScore = scoreGroups[score];
            const rankStr = getPositionWithSuffix(currentRank);

            await Result.updateMany({ _id: { $in: idsWithScore } }, { $set: { position: rankStr } });

            currentRank += idsWithScore.length;
        }

        await logAction('CALCULATE_RANKS', 'Result', undefined, `Calculated ranks for Level ${level} (${term} Term, ${sessionStr})`);

        return { success: true, message: 'Class ranks calculated successfully.' };
    } catch (err: any) {
        console.error("Rank calculation error:", err);
        return { success: false, error: err.message };
    }
}

export async function getClassAssessment(level: number, term: string, sessionStr: string) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== level) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        const students = await Student.find({ currentLevel: level, status: 'Active' }).sort({ surname: 1, firstName: 1 }).lean();
        const studentIds = students.map(s => s._id);
        const results = await Result.find({ studentId: { $in: studentIds }, term, session: sessionStr }).lean();

        const resultMap = new Map();
        for (const res of results) {
            resultMap.set(res.studentId.toString(), {
                attendance: res.attendance || { daysPresent: 0, daysAbsent: 0 },
                affectiveTraits: res.affectiveTraits || {},
                psychomotorSkills: res.psychomotorSkills || {},
                classTeacherRemark: res.classTeacherRemark || '',
                headTeacherRemark: res.headTeacherRemark || ''
            });
        }

        const data = students.map((s: any) => ({
            _id: s._id.toString(),
            admissionNum: s.admissionNum,
            name: `${s.surname} ${s.firstName || ''} ${s.otherNames || ''}`.trim(),
            assessment: resultMap.get(s._id.toString()) || {
                attendance: { daysPresent: 0, daysAbsent: 0 },
                affectiveTraits: {},
                psychomotorSkills: {},
                classTeacherRemark: '',
                headTeacherRemark: ''
            }
        }));

        return { success: true, students: data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function saveClassAssessment(level: number, term: string, sessionStr: string, assessmentData: any[]) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.CLASS_ADMIN)) {
        return { success: false, error: 'Unauthorized' };
    }

    if (session.user.role === UserRole.CLASS_ADMIN && session.user.assignedLevel !== level) {
        return { success: false, error: 'Unauthorized' };
    }

    await connectToDatabase();

    try {
        for (const data of assessmentData) {
            const result = await Result.findOne({ studentId: data.studentId, term, session: sessionStr });

            if (result) {
                result.attendance = data.attendance;
                result.affectiveTraits = data.affectiveTraits;
                result.psychomotorSkills = data.psychomotorSkills;
                if (data.classTeacherRemark !== undefined) result.classTeacherRemark = data.classTeacherRemark;
                if (data.headTeacherRemark !== undefined) result.headTeacherRemark = data.headTeacherRemark;
                await result.save();
            } else {
                await Result.create({
                    studentId: data.studentId,
                    term,
                    session: sessionStr,
                    scores: [],
                    attendance: data.attendance,
                    affectiveTraits: data.affectiveTraits,
                    psychomotorSkills: data.psychomotorSkills,
                    classTeacherRemark: data.classTeacherRemark || '',
                    headTeacherRemark: data.headTeacherRemark || '',
                    isPaid: false,
                    accessTokenUsed: false
                });
            }
        }

        await logAction('UPDATE_ASSESSMENT', 'Result', undefined, `Updated class assessments for Level ${level} (${term} Term, ${sessionStr})`);

        return { success: true, message: 'Class assessment saved successfully.' };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
