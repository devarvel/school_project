'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, FileUp, Trash2, Loader2, GraduationCap, FileText, FileSpreadsheet, Edit, Upload, X, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createStudent, deleteStudent, updateStudent, bulkCreateStudents } from '@/actions/student-actions';
import { ResultUploadModal } from '@/components/admin/ResultUploadModal';
import { deleteResult } from '@/actions/result-actions';
import { cn } from '@/lib/utils';
import { getClassLabel, LEVELS } from '@/lib/constants';
import { UserRole } from '@/types/enums';
import * as XLSX from 'xlsx';

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
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any | null>(null);
    const [search, setSearch] = useState('');
    const [uploadingStudent, setUploadingStudent] = useState<any | null>(null);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            firstName: formData.get('firstName') as string,
            otherNames: formData.get('otherNames') as string,
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

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingStudent) return;

        const formData = new FormData(e.currentTarget);
        // We only send fields that are present
        const data = {
            admissionNum: formData.get('admissionNum') as string,
            surname: formData.get('surname') as string,
            firstName: formData.get('firstName') as string,
            otherNames: formData.get('otherNames') as string,
            currentLevel: editingStudent.currentLevel, // Preserve level or allow change? Usually preserve for Class Admin.
        };

        const res = await updateStudent(editingStudent._id, data);
        if (res.success) {
            setEditingStudent(null);
            if (selectedLevel) refreshStudents(selectedLevel);
        } else {
            alert(res.error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !selectedLevel) return;

        const file = e.target.files[0];
        setImporting(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            // Map and Validate
            const studentsToCreate = jsonData.map((row: any) => ({
                admissionNum: row['Admission Number'] || row['AdmissionNum'] || row['ID'],
                surname: row['Surname'] || row['Last Name'],
                firstName: row['First Name'] || row['FirstName'],
                otherNames: row['Other Names'] || row['OtherNames'] || row['Middle Name'],
                currentLevel: selectedLevel,
            })).filter(s => s.admissionNum && s.surname);

            if (studentsToCreate.length === 0) {
                alert('No valid students found. Ensure headers: "Admission Number", "Surname", "First Name", "Other Names"');
                setImporting(false);
                return;
            }

            if (confirm(`Found ${studentsToCreate.length} students. Import now?`)) {
                const res = await bulkCreateStudents(studentsToCreate);
                if (res.success) {
                    alert(`Imported ${res.count} students successfully.${res.errors && res.errors.length > 0 ? `\nErrors: ${res.errors.length}` : ''}`);
                    setShowImportModal(false);
                    if (selectedLevel) refreshStudents(selectedLevel);
                } else {
                    alert(res.error);
                }
            }
        } catch (err: any) {
            alert('Failed to parse file: ' + err.message);
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredStudents = students.filter(s =>
        s.surname.toLowerCase().includes(search.toLowerCase()) ||
        (s.firstName && s.firstName.toLowerCase().includes(search.toLowerCase())) ||
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
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Import Excel
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors text-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Add Student
                    </button>
                </div>
            </div>

            {showAddForm && (
                <Card className="bg-slate-900 border-indigo-500/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Add New Student</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Admission #</label>
                                <input name="admissionNum" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" placeholder="SCH-001" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Surname</label>
                                <input name="surname" required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" placeholder="DOE" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">First Name</label>
                                <input name="firstName" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" placeholder="John" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Other Names</label>
                                <input name="otherNames" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" placeholder="O." />
                            </div>
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold h-10">Save</button>
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
                                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-indigo-400 font-bold flex-shrink-0">
                                            {student.surname[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold flex items-center gap-2">
                                                {student.surname}
                                                <span className="font-normal text-slate-300">
                                                    {student.firstName} {student.otherNames}
                                                </span>
                                            </h3>
                                            <p className="text-sm font-mono text-slate-400">{student.admissionNum}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            title="Edit Student"
                                            onClick={(e) => { e.stopPropagation(); setEditingStudent(student); }}
                                            className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            title="Upload Result"
                                            onClick={(e) => { e.stopPropagation(); setUploadingStudent(student); }}
                                            className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors"
                                        >
                                            <FileUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            title="Delete Student"
                                            onClick={async (e) => {
                                                e.stopPropagation();
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
                                            <Trash2 className="w-4 h-4" />
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

            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-lg bg-slate-900 border-slate-800 shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Import Students (Excel)</CardTitle>
                            <button onClick={() => !importing && setShowImportModal(false)} disabled={importing}>
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-4 bg-indigo-500/10 text-indigo-300 text-sm rounded-lg border border-indigo-500/20 flex gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-bold mb-1">Spreadsheet Guidelines</p>
                                    <p>First row must be headers: <b>Admission Number, Surname, First Name, Other Names</b>.</p>
                                </div>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "border-2 border-dashed border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all",
                                    importing && "opacity-50 pointer-events-none"
                                )}
                            >
                                <input ref={fileInputRef} type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                                {importing ? (
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                ) : (
                                    <Upload className="w-10 h-10 text-slate-500" />
                                )}
                                <p className="mt-4 text-sm font-medium text-slate-300">
                                    {importing ? 'Processing File...' : 'Click to Upload Excel File'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {editingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Edit Student</CardTitle>
                            <button onClick={() => setEditingStudent(null)}>
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Admission #</label>
                                    <input name="admissionNum" defaultValue={editingStudent.admissionNum} required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Surname</label>
                                    <input name="surname" defaultValue={editingStudent.surname} required className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">First Name</label>
                                    <input name="firstName" defaultValue={editingStudent.firstName} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 uppercase font-bold">Other Names</label>
                                    <input name="otherNames" defaultValue={editingStudent.otherNames} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded">Update Student</button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
