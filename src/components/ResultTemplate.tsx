'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Mail, Phone, MapPin } from 'lucide-react';
import { getClassName } from '@/lib/constants';

interface Score {
    subject: string;
    ca: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
}

interface ResultTemplateProps {
    student: {
        name: string;
        admissionNum: string;
        currentLevel: number;
    };
    result: {
        term: string;
        session: string;
        scores: Score[];
        classTeacherRemark: string;
        headTeacherRemark: string;
        attendance?: { daysPresent: number; daysAbsent: number };
        affectiveTraits?: Record<string, number>;
        psychomotorSkills?: Record<string, number>;
    };
    stats: {
        position: string;
        totalStudents: number;
        totalScore: number;
        totalPossible: number;
        average: string;
    };
    settings: {
        schoolLogo?: string;
        schoolStamp?: string;
        directorSignature?: string;
    };
}

export const ResultTemplate = React.forwardRef<HTMLDivElement, ResultTemplateProps>(
    ({ student, result, stats, settings }, ref) => {
        return (
            <div
                ref={ref}
                className="w-full bg-white text-slate-900 p-8 shadow-sm flex flex-col mx-auto relative overflow-hidden print-page"
                style={{
                    width: '210mm',
                    minHeight: '297mm', // A4 Paper size
                    fontFamily: "'Times New Roman', Times, serif"
                }}
            >
                {/* Background Watermark */}
                {settings.schoolLogo && (
                    <div
                        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none flex items-center justify-center grayscale"
                        style={{
                            backgroundImage: `url(${settings.schoolLogo})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            backgroundSize: '50%'
                        }}
                    />
                )}

                {/* Header */}
                <div className="flex items-center justify-between border-b-4 border-indigo-900 pb-6 mb-6 relative z-10">
                    {settings.schoolLogo ? (
                        <div className="w-32 h-32 flex-shrink-0">
                            <img src={settings.schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-32 h-32 bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                            <span className="text-sm font-bold text-slate-400">NO LOGO</span>
                        </div>
                    )}

                    <div className="flex-1 text-center px-4">
                        <h1 className="text-4xl font-extrabold text-indigo-900 uppercase tracking-widest mb-2 font-serif">
                            Al-Qalam Academy
                        </h1>
                        <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">
                            Excellence in Knowledge and Character
                        </p>
                        <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> 123 Education Way, City</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +234 800 000 0000</span>
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> info@alqalam.edu</span>
                        </div>
                    </div>

                    <div className="w-32 h-32 border-2 border-slate-300 flex items-center justify-center bg-slate-50 flex-shrink-0 p-1">
                        <div className="w-full h-full border border-slate-200 flex items-center justify-center text-center">
                            <span className="text-xs text-slate-400 uppercase">Student<br />Passport</span>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-6 relative z-10">
                    <h2 className="text-xl font-bold uppercase tracking-widest bg-indigo-900 text-white inline-block px-6 py-2 rounded-sm shadow-sm">
                        Terminal Examination Report
                    </h2>
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm relative z-10">
                    <div className="flex border-b border-slate-200 pb-1">
                        <span className="font-bold w-36 uppercase text-slate-600">Name of Student:</span>
                        <span className="font-semibold uppercase flex-1">{student.name}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-1">
                        <span className="font-bold w-36 uppercase text-slate-600">Admission No:</span>
                        <span className="font-semibold uppercase flex-1">{student.admissionNum}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-1">
                        <span className="font-bold w-36 uppercase text-slate-600">Class:</span>
                        <span className="font-semibold uppercase flex-1">{getClassName(student.currentLevel)}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-1">
                        <span className="font-bold w-36 uppercase text-slate-600">Term:</span>
                        <span className="font-semibold uppercase flex-1">{result.term} Term</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-1">
                        <span className="font-bold w-36 uppercase text-slate-600">Academic Session:</span>
                        <span className="font-semibold uppercase flex-1">{result.session}</span>
                    </div>
                    <div className="flex border-b border-slate-200 pb-1">
                        <span className="font-bold w-36 uppercase text-slate-600">No. in Class:</span>
                        <span className="font-semibold uppercase flex-1">{stats.totalStudents}</span>
                    </div>
                </div>

                {/* Scores Grid */}
                <div className="mb-8 relative z-10 flex-1">
                    <table className="w-full text-sm border-collapse border-2 border-slate-800">
                        <thead>
                            <tr className="bg-indigo-50 border-b-2 border-slate-800">
                                <th className="border border-slate-800 p-2 text-left w-64 uppercase font-bold text-slate-800">Subject</th>
                                <th className="border border-slate-800 p-2 text-center w-20 uppercase font-bold text-slate-800 text-xs">C.A.<br />(40%)</th>
                                <th className="border border-slate-800 p-2 text-center w-20 uppercase font-bold text-slate-800 text-xs">Exam<br />(60%)</th>
                                <th className="border border-slate-800 p-2 text-center w-24 uppercase font-bold text-slate-800 text-xs">Total<br />(100%)</th>
                                <th className="border border-slate-800 p-2 text-center w-20 uppercase font-bold text-slate-800 text-xs">Grade</th>
                                <th className="border border-slate-800 p-2 text-left uppercase font-bold text-slate-800 text-xs">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.scores.map((score, index) => (
                                <tr key={index} className="border-b border-slate-300 font-medium">
                                    <td className="border border-slate-800 p-2 uppercase font-bold">{score.subject}</td>
                                    <td className="border border-slate-800 p-2 text-center">{score.ca}</td>
                                    <td className="border border-slate-800 p-2 text-center">{score.exam}</td>
                                    <td className="border border-slate-800 p-2 text-center font-bold bg-slate-50">{score.total}</td>
                                    <td className="border border-slate-800 p-2 text-center font-bold">{score.grade}</td>
                                    <td className="border border-slate-800 p-2 text-left uppercase text-xs tracking-wider">{score.remark}</td>
                                </tr>
                            ))}
                            {result.scores.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="border border-slate-800 p-8 text-center text-slate-500 font-sans italic">
                                        No scores recorded for this term.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Performance Summary */}
                <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                    <div className="border border-slate-800 rounded-sm p-4 bg-slate-50 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-widest">Total Score</span>
                        <span className="text-2xl font-black text-indigo-900">{stats.totalScore}</span>
                        <span className="text-xs text-slate-400 mt-1">out of {stats.totalPossible}</span>
                    </div>
                    <div className="border border-slate-800 rounded-sm p-4 bg-slate-50 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold uppercase text-slate-500 mb-1 tracking-widest">Average</span>
                        <span className="text-2xl font-black text-indigo-900">{stats.average}%</span>
                    </div>
                    <div className="border border-slate-800 rounded-sm p-4 bg-indigo-50 flex flex-col items-center justify-center relative overflow-hidden">
                        <span className="text-xs font-bold uppercase text-indigo-800 mb-1 tracking-widest relative z-10">Position in Class</span>
                        <span className="text-3xl font-black text-indigo-900 relative z-10">{stats.position}</span>
                    </div>
                </div>

                {/* Cognitive and Psychomotor Domains */}
                <div className="grid grid-cols-2 gap-8 mb-8 relative z-10">
                    <div>
                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-2 border-b-2 border-slate-300 pb-1">Affective Traits</h3>
                        <table className="w-full text-xs font-medium border border-slate-300 text-left">
                            <tbody>
                                {['Punctuality', 'Neatness', 'Politeness', 'Honesty', 'Relationship with Peers'].map((trait, idx) => (
                                    <tr key={idx} className="border-b border-slate-300">
                                        <td className="p-1 border-r border-slate-300 w-3/4">{trait}</td>
                                        <td className="p-1 text-center font-bold">{result.affectiveTraits?.[trait] || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-1 text-[10px] text-slate-500 italic">Scale: 5 (Excellent) to 1 (Poor)</div>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs mb-2 border-b-2 border-slate-300 pb-1">Psychomotor Skills</h3>
                        <table className="w-full text-xs font-medium border border-slate-300 text-left">
                            <tbody>
                                {['Handwriting', 'Sports & Games', 'Verbal Fluency'].map((skill, idx) => (
                                    <tr key={idx} className="border-b border-slate-300">
                                        <td className="p-1 border-r border-slate-300 w-3/4">{skill}</td>
                                        <td className="p-1 text-center font-bold">{result.psychomotorSkills?.[skill] || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-4 border border-slate-400 p-2 bg-slate-50">
                            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-1">Attendance Record</h3>
                            <div className="flex justify-between text-xs font-medium">
                                <span>Present: <strong className="text-indigo-900 ml-1">{result.attendance?.daysPresent || 0}</strong></span>
                                <span>Absent: <strong className="text-red-700 ml-1">{result.attendance?.daysAbsent || 0}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Remarks Section */}
                <div className="space-y-4 mb-12 text-sm relative z-10">
                    <div className="flex border-b-2 border-dotted border-slate-400 pb-2 items-end min-h-[40px]">
                        <span className="font-bold uppercase text-slate-700 w-48 shrink-0">Class Teacher's Remark:</span>
                        <span className="font-medium italic text-slate-800 pl-4 flex-1">{result.classTeacherRemark || 'No remark provided.'}</span>
                    </div>
                    <div className="flex border-b-2 border-dotted border-slate-400 pb-2 items-end min-h-[40px]">
                        <span className="font-bold uppercase text-slate-700 w-48 shrink-0">Head Teacher's Remark:</span>
                        <span className="font-medium italic text-slate-800 pl-4 flex-1">{result.headTeacherRemark || 'Satisfactory performance. Keep it up.'}</span>
                    </div>
                </div>

                {/* Signatures and Stamp */}
                <div className="flex justify-between items-end mt-auto pt-8 relative z-10">
                    <div className="w-64 text-center">
                        <div className="h-20 mb-2 border-b-2 border-slate-800 relative">
                            {/* Empty space for raw signature if physical, or image if digital for teacher */}
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest text-slate-600">Form Teacher's Signature</span>
                    </div>

                    <div className="w-48 h-48 relative flex items-center justify-center">
                        {settings.schoolStamp && (
                            <img
                                src={settings.schoolStamp}
                                alt="Official Stamp"
                                className="w-full h-full object-contain opacity-80 mix-blend-multiply"
                                style={{ transform: 'rotate(-15deg)' }}
                            />
                        )}
                        {!settings.schoolStamp && (
                            <div className="w-32 h-32 border-4 border-indigo-900/20 rounded-full flex items-center justify-center rotate-[-15deg]">
                                <span className="font-bold text-indigo-900/20 uppercase tracking-widest">Official<br />Stamp</span>
                            </div>
                        )}
                    </div>

                    <div className="w-64 text-center">
                        <div className="h-20 mb-2 border-b-2 border-slate-800 relative flex items-end justify-center pb-1">
                            {settings.directorSignature && (
                                <img
                                    src={settings.directorSignature}
                                    alt="Director Signature"
                                    className="max-h-16 max-w-full object-contain absolute bottom-1 mix-blend-multiply"
                                />
                            )}
                        </div>
                        <span className="font-bold uppercase text-xs tracking-widest text-slate-600">Director's Signature</span>
                    </div>
                </div>
            </div>
        );
    }
);

ResultTemplate.displayName = 'ResultTemplate';
