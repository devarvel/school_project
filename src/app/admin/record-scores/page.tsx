'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Search, UserCheck, BookOpen, ClipboardList } from 'lucide-react';
import { getStudentsForScoring, saveClassScores, calculateClassRanks, getClassAssessment, saveClassAssessment } from '@/actions/result-actions';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { LEVELS, getClassLabel, getSubjectsForLevel, getCurrentSession, getSessionOptions } from '@/lib/constants';

const AFFECTIVE_TRAITS = ['Punctuality', 'Neatness', 'Politeness', 'Honesty', 'Relationship with Peers'];
const PSYCHOMOTOR_SKILLS = ['Handwriting', 'Sports & Games', 'Verbal Fluency'];

export default function RecordScoresPage() {
    const { data: session } = useSession();

    const [mode, setMode] = useState<'scores' | 'assessment'>('scores');
    const [level, setLevel] = useState<number | ''>(session?.user?.assignedLevel || 1);
    const [term, setTerm] = useState('First');
    const [sessionStr, setSessionStr] = useState(getCurrentSession());
    const [subject, setSubject] = useState(getSubjectsForLevel(level || 1)[0] || 'Mathematics');

    const [students, setStudents] = useState<any[]>([]);
    const [scores, setScores] = useState<Record<string, { ca: string, exam: string, classTeacherRemark: string }>>({});
    const [assessments, setAssessments] = useState<Record<string, any>>({});

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (session?.user?.assignedLevel) {
            setLevel(session.user.assignedLevel);
            setSubject(getSubjectsForLevel(session.user.assignedLevel)[0] || 'Mathematics');
        }
    }, [session]);

    const handleFetchStudents = async () => {
        if (!level || !term || !sessionStr) {
            setMessage({ type: 'error', text: 'Please fill Level, Term, and Session.' });
            return;
        }

        setFetching(true);
        setMessage(null);

        if (mode === 'scores') {
            const res = await getStudentsForScoring(Number(level), term, sessionStr, subject);
            if (res.success && res.students) {
                setStudents(res.students);
                const initialScores: Record<string, { ca: string, exam: string, classTeacherRemark: string }> = {};
                res.students.forEach((s: any) => {
                    initialScores[s._id] = {
                        ca: s.existingScore.ca?.toString() || '',
                        exam: s.existingScore.exam?.toString() || '',
                        classTeacherRemark: s.existingScore.classTeacherRemark || ''
                    };
                });
                setScores(initialScores);
            } else {
                setMessage({ type: 'error', text: res.error || 'Failed to load students.' });
            }
        } else {
            const res = await getClassAssessment(Number(level), term, sessionStr);
            if (res.success && res.students) {
                setStudents(res.students);
                const initialAssessments: Record<string, any> = {};
                res.students.forEach((s: any) => {
                    initialAssessments[s._id] = {
                        attendance: {
                            daysPresent: s.assessment.attendance?.daysPresent || 0,
                            daysAbsent: s.assessment.attendance?.daysAbsent || 0
                        },
                        affectiveTraits: s.assessment.affectiveTraits || {},
                        psychomotorSkills: s.assessment.psychomotorSkills || {},
                        classTeacherRemark: s.assessment.classTeacherRemark || '',
                        headTeacherRemark: s.assessment.headTeacherRemark || ''
                    };
                });
                setAssessments(initialAssessments);
            } else {
                setMessage({ type: 'error', text: res.error || 'Failed to load assessments.' });
            }
        }

        setFetching(false);
    };

    const handleScoreChange = (studentId: string, field: 'ca' | 'exam' | 'classTeacherRemark', value: string) => {
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleAssessmentChange = (studentId: string, category: 'attendance' | 'affectiveTraits' | 'psychomotorSkills' | 'remarks', key: string, value: string | number) => {
        setAssessments(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [category === 'remarks' ? key : category]: category === 'remarks' ? value : {
                    ...prev[studentId][category],
                    [key]: Number(value) || 0
                }
            }
        }));
    };

    const handleSaveData = async () => {
        setLoading(true);
        setMessage(null);

        if (mode === 'scores') {
            const scoresData = Object.entries(scores).map(([studentId, data]) => ({
                studentId,
                ca: data.ca,
                exam: data.exam,
                classTeacherRemark: data.classTeacherRemark
            }));

            const res = await saveClassScores(Number(level), term, sessionStr, subject, scoresData);
            if (res.success) setMessage({ type: 'success', text: res.message || 'Scores saved successfully.' });
            else setMessage({ type: 'error', text: res.error || 'Failed to save scores.' });
        } else {
            const dataToSave = Object.entries(assessments).map(([studentId, data]) => ({
                studentId,
                attendance: data.attendance,
                affectiveTraits: data.affectiveTraits,
                psychomotorSkills: data.psychomotorSkills,
                classTeacherRemark: data.classTeacherRemark,
                headTeacherRemark: data.headTeacherRemark
            }));

            const res = await saveClassAssessment(Number(level), term, sessionStr, dataToSave);
            if (res.success) setMessage({ type: 'success', text: res.message || 'Assessment saved successfully.' });
            else setMessage({ type: 'error', text: res.error || 'Failed to save assessment.' });
        }
        setLoading(false);
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admissionNum.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Record Scores</h2>
                    <p className="text-slate-400">Manage CA, Exam, and Class Assessment records.</p>
                </div>
                <button
                    onClick={async () => {
                        if (!level || !term || !sessionStr) {
                            setMessage({ type: 'error', text: 'Select Level, Term, and Session first.' });
                            return;
                        }
                        if (confirm(`Calculate and assign ranks for Level ${level}, ${term} Term ${sessionStr}? This computes all subject totals across the class and saves their position.`)) {
                            setLoading(true);
                            setMessage(null);
                            const res = await calculateClassRanks(Number(level), term, sessionStr);
                            if (res.success) setMessage({ type: 'success', text: res.message! });
                            else setMessage({ type: 'error', text: res.error! });
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-lg font-medium border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Calculate Class Ranks
                </button>
            </div>

            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg">Class Context</CardTitle>
                        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                            <button
                                onClick={() => { setMode('scores'); setStudents([]); }}
                                className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === 'scores' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                            >
                                <BookOpen className="w-4 h-4" /> Subject Scores
                            </button>
                            <button
                                onClick={() => { setMode('assessment'); setStudents([]); }}
                                className={cn("flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all", mode === 'assessment' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800")}
                            >
                                <ClipboardList className="w-4 h-4" /> Class Assessment
                            </button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Level</label>
                            <select
                                value={level}
                                onChange={(e) => {
                                    const newLevel = Number(e.target.value);
                                    setLevel(newLevel);
                                    setSubject(getSubjectsForLevel(newLevel)[0] || 'Mathematics');
                                    setStudents([]);
                                }}
                                disabled={session?.user?.role === 'Class-Admin'}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                            >
                                {LEVELS.map(l => (
                                    <option key={l} value={l}>{getClassLabel(l)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Term</label>
                            <select
                                value={term}
                                onChange={(e) => { setTerm(e.target.value); setStudents([]); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="First">First</option>
                                <option value="Second">Second</option>
                                <option value="Third">Third</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Session</label>
                            <select
                                value={sessionStr}
                                onChange={(e) => { setSessionStr(e.target.value); setStudents([]); }}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {getSessionOptions().map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        {mode === 'scores' && (
                            <div className="space-y-1.5 animate-in fade-in">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Subject</label>
                                <select
                                    value={subject}
                                    onChange={(e) => { setSubject(e.target.value); setStudents([]); }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {getSubjectsForLevel(Number(level) || 1).map(subj => (
                                        <option key={subj} value={subj}>{subj}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleFetchStudents}
                            disabled={fetching}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                            Load Students Grid
                        </button>
                    </div>
                </CardContent>
            </Card>

            {message && (
                <div className={cn(
                    "p-4 rounded-lg flex items-center gap-3 text-sm border animate-in fade-in slide-in-from-top-1",
                    message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                )}>
                    {message.text}
                </div>
            )}

            {students.length > 0 && (
                <Card className="bg-slate-900 border-slate-800 animate-in fade-in">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                        <CardTitle className="text-white text-lg">{mode === 'scores' ? 'Score Entry Grid' : 'Class Assessment Grid'}</CardTitle>
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/50">
                                        <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[200px] sticky left-0 bg-slate-950/90 backdrop-blur">Student Name</th>

                                        {mode === 'scores' ? (
                                            <>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">CA (40)</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-32">Exam (60)</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 text-center">Total</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 text-center">Grade</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-64">Teacher Remark</th>
                                            </>
                                        ) : (
                                            <>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 border-l border-slate-800 text-center bg-emerald-500/10 text-emerald-500">Present (Days)</th>
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 border-r border-slate-800 text-center bg-red-500/10 text-red-500">Absent (Days)</th>
                                                {AFFECTIVE_TRAITS.map(t => (
                                                    <th key={t} className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 text-center">{t}</th>
                                                ))}
                                                <th className="border-r border-slate-800"></th>
                                                {PSYCHOMOTOR_SKILLS.map(t => (
                                                    <th key={t} className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-20 text-center">{t}</th>
                                                ))}
                                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-64 border-l border-slate-800">Remarks</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => {
                                        if (mode === 'scores') {
                                            const caVal = scores[student._id]?.ca || '';
                                            const examVal = scores[student._id]?.exam || '';
                                            const remarkVal = scores[student._id]?.classTeacherRemark || '';

                                            const caNum = Number(caVal) || 0;
                                            const examNum = Number(examVal) || 0;
                                            const totalNum = caVal !== '' || examVal !== '' ? caNum + examNum : null;

                                            let gradeStr = '-';
                                            let gradeColor = 'text-slate-500';

                                            if (totalNum !== null) {
                                                if (totalNum >= 80) { gradeStr = 'A'; gradeColor = 'text-emerald-400'; }
                                                else if (totalNum >= 70) { gradeStr = 'B'; gradeColor = 'text-emerald-400'; }
                                                else if (totalNum >= 60) { gradeStr = 'C'; gradeColor = 'text-indigo-400'; }
                                                else if (totalNum >= 50) { gradeStr = 'D'; gradeColor = 'text-amber-400'; }
                                                else if (totalNum >= 40) { gradeStr = 'E'; gradeColor = 'text-orange-400'; }
                                                else { gradeStr = 'F'; gradeColor = 'text-red-400'; }
                                            }

                                            return (
                                                <tr key={student._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-4 sticky left-0 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">
                                                        <div className="font-semibold text-slate-200">{student.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{student.admissionNum}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <input type="number" min="0" max="40" value={caVal} onChange={(e) => handleScoreChange(student._id, 'ca', e.target.value)} className={cn("w-full bg-slate-950 border rounded-md px-3 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-center", caNum > 40 ? "border-red-500" : "border-slate-800")} placeholder="0" />
                                                    </td>
                                                    <td className="p-4">
                                                        <input type="number" min="0" max="60" value={examVal} onChange={(e) => handleScoreChange(student._id, 'exam', e.target.value)} className={cn("w-full bg-slate-950 border rounded-md px-3 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-center", examNum > 60 ? "border-red-500" : "border-slate-800")} placeholder="0" />
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="font-mono text-lg font-semibold text-white">{totalNum !== null ? totalNum : <span className="text-slate-700">-</span>}</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className={cn("font-bold text-lg", gradeColor)}>{gradeStr}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <input type="text" value={remarkVal} onChange={(e) => handleScoreChange(student._id, 'classTeacherRemark', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Optional overall remark" />
                                                    </td>
                                                </tr>
                                            );
                                        } else {
                                            const stAssess = assessments[student._id] || { attendance: { daysPresent: 0, daysAbsent: 0 }, affectiveTraits: {}, psychomotorSkills: {} };
                                            return (
                                                <tr key={student._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                    <td className="p-4 sticky left-0 bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.1)] z-10">
                                                        <div className="font-semibold text-slate-200 truncate">{student.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono truncate">{student.admissionNum}</div>
                                                    </td>
                                                    <td className="p-4 border-l border-slate-800 bg-slate-950/30">
                                                        <input type="number" min="0" value={stAssess.attendance?.daysPresent || ''} onChange={(e) => handleAssessmentChange(student._id, 'attendance', 'daysPresent', e.target.value)} className="w-full bg-slate-950 border border-emerald-500/20 rounded-md px-2 py-1.5 text-emerald-400 text-sm focus:ring-1 focus:ring-emerald-500 outline-none text-center" placeholder="0" />
                                                    </td>
                                                    <td className="p-4 border-r border-slate-800 bg-slate-950/30">
                                                        <input type="number" min="0" value={stAssess.attendance?.daysAbsent || ''} onChange={(e) => handleAssessmentChange(student._id, 'attendance', 'daysAbsent', e.target.value)} className="w-full bg-slate-950 border border-red-500/20 rounded-md px-2 py-1.5 text-red-400 text-sm focus:ring-1 focus:ring-red-500 outline-none text-center" placeholder="0" />
                                                    </td>
                                                    {AFFECTIVE_TRAITS.map(t => (
                                                        <td key={'aff' + t} className="p-3 text-center">
                                                            <input type="number" min="1" max="5" value={stAssess.affectiveTraits?.[t] || ''} onChange={(e) => handleAssessmentChange(student._id, 'affectiveTraits', t, e.target.value)} className={cn("w-12 bg-slate-950 border border-slate-800 rounded-md px-1 py-1 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-center", (stAssess.affectiveTraits?.[t] > 5) && "border-red-500 text-red-400")} title="Rate 1-5" />
                                                        </td>
                                                    ))}
                                                    <td className="border-r border-slate-800"></td>
                                                    {PSYCHOMOTOR_SKILLS.map(t => (
                                                        <td key={'psy' + t} className="p-3 text-center">
                                                            <input type="number" min="1" max="5" value={stAssess.psychomotorSkills?.[t] || ''} onChange={(e) => handleAssessmentChange(student._id, 'psychomotorSkills', t, e.target.value)} className={cn("w-12 bg-slate-950 border border-slate-800 rounded-md px-1 py-1 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-center", (stAssess.psychomotorSkills?.[t] > 5) && "border-red-500 text-red-400")} title="Rate 1-5" />
                                                        </td>
                                                    ))}
                                                    <td className="p-4 border-l border-slate-800 space-y-2">
                                                        <input
                                                            type="text"
                                                            value={stAssess.classTeacherRemark || ''}
                                                            onChange={(e) => handleAssessmentChange(student._id, 'remarks', 'classTeacherRemark', e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            placeholder="Class Teacher Remark"
                                                        />
                                                        {session?.user?.role === 'Super-Admin' && (
                                                            <input
                                                                type="text"
                                                                value={stAssess.headTeacherRemark || ''}
                                                                onChange={(e) => handleAssessmentChange(student._id, 'remarks', 'headTeacherRemark', e.target.value)}
                                                                className="w-full bg-slate-950 border border-indigo-500/20 rounded-md px-3 py-1.5 text-indigo-400 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                placeholder="Head Teacher Remark"
                                                            />
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    })}
                                </tbody>
                            </table>
                            {filteredStudents.length === 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    No students found.
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
                            <button
                                onClick={handleSaveData}
                                disabled={loading || students.length === 0}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                Publish Data
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
