'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, FileUp, Trash2, Loader2, GraduationCap, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createStudent, deleteStudent } from '@/actions/student-actions';
import { ResultUploadModal } from '@/components/admin/ResultUploadModal';
import { deleteResult } from '@/actions/result-actions';
import { cn } from '@/lib/utils';
import { getClassLabel, LEVELS } from '@/lib/constants';
import { UserRole } from '@/types/enums';

function StudentResultsList({ studentId, onDelete }: { studentId: string, onDelete: (id: string) => void }) {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/admin/results?studentId=${studentId}`)
            .then(res => res.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            });
    }, [studentId]);

    if (loading) return <div className="text-xs text-slate-500">Loading results...</div>;
    if (results.length === 0) return <div className="text-xs text-slate-600 italic">No results uploaded.</div>;

    return (
        <div className="space-y-2">
            {results.map(res => (
                <div key={res._id} className="flex items-center justify-between bg-slate-950/50 p-3 rounded border border-slate-800/50 group">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded text-indigo-400">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-200">{res.term} Term - {res.session}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{res.pdfUrl.split('/').pop()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={res.pdfUrl} target="_blank" className="p-1.5 text-slate-400 hover:text-indigo-400"><FileUp className="w-4 h-4" /></a>
                        <button onClick={() => onDelete(res._id)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function StudentsPage() {
    const { data: session } = useSession();
    const assignedLevel = session?.user?.assignedLevel;
    const isSuperAdmin = session?.user?.role === 'Super-Admin'; // Hardcoding string since UserRole might be string
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [search, setSearch] = useState('');
    const [uploadingStudent, setUploadingStudent] = useState<any | null>(null);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    useEffect(() => {
        if (assignedLevel) {
            setSelectedLevel(assignedLevel);
        }
    }, [assignedLevel]);

    useEffect(() => {
        if (selectedLevel) {
            refreshStudents(selectedLevel);
        }
    }, [selectedLevel]);

    const refreshStudents = async (level: number) => {
        setLoading(true);
        const res = await fetch(`/api/admin/students?level=${level}`);
        const data = await res.json();
        setStudents(data);
        setLoading(false);
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedLevel) return alert('Please select a class first');

        const formData = new FormData(e.currentTarget);
        const data = {
            admissionNum: formData.get('admissionNum') as string,
            surname: formData.get('surname') as string,
            currentLevel: selectedLevel,
        };

        const res = await createStudent(data);
        if (res.success) {
            setShowAddForm(false);
            if (selectedLevel) refreshStudents(selectedLevel);
        } else {
            alert(res.error);
        }
    };

    const filteredStudents = students.filter(s =>
        s.surname.toLowerCase().includes(search.toLowerCase()) ||
        s.admissionNum.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteResult = async (id: string) => {
        if (confirm('Delete this result?')) {
            await deleteResult(id);
            if (selectedLevel) refreshStudents(selectedLevel);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{getClassLabel(assignedLevel!)} Management</h2>
                    <p className="text-slate-400">Manage students and results for your assigned class.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-lg font-medium transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Add Student
                </button>
            </div>

            {showAddForm && (
                <Card className="bg-slate-900 border-indigo-500/30">
                    <CardContent className="p-6">
                        <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Admission #</label>
                                <input name="admissionNum" required className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" placeholder="SCH-001" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Surname</label>
                                <input name="surname" required className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" placeholder="DOE" />
                            </div>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold">Save Student</button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                ) : filteredStudents.length === 0 ? (
                    <p className="text-slate-500 text-center py-10">No students found for {getClassLabel(assignedLevel!)}.</p>
                ) : (
                    filteredStudents.map((student) => (
                        <Card key={student._id} className={cn("transition-all", expandedStudent === student._id && "ring-1 ring-indigo-500")}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedStudent(expandedStudent === student._id ? null : student._id)}>
                                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 font-bold">
                                            {student.surname[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold">{student.surname}</h3>
                                            <p className="text-sm font-mono text-slate-400">{student.admissionNum}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            title="Upload Result"
                                            onClick={() => setUploadingStudent(student)}
                                            className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors"
                                        >
                                            <FileUp className="w-5 h-5" />
                                        </button>
                                        <button
                                            title="Delete Student"
                                            onClick={async () => {
                                                if (confirm('Delete student and records?')) {
                                                    const res = await deleteStudent(student._id);
                                                    if (res.success) {
                                                        if (selectedLevel) refreshStudents(selectedLevel);
                                                    } else {
                                                        alert(res.error || 'Failed to delete student');
                                                    }
                                                }
                                            }}
                                            className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Results Section */}
                                {expandedStudent === student._id && (
                                    <div className="mt-6 pt-6 border-t border-slate-800 animate-in slide-in-from-top duration-300">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Academic Results</h4>
                                        <div className="space-y-2">
                                            <StudentResultsList studentId={student._id} onDelete={handleDeleteResult} />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {uploadingStudent && (
                <ResultUploadModal
                    student={uploadingStudent}
                    onClose={() => setUploadingStudent(null)}
                    onSuccess={() => selectedLevel && refreshStudents(selectedLevel)}
                />
            )}
        </div>
    );
}
