'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ResultTemplate } from './ResultTemplate';
import { Printer } from 'lucide-react';

export default function PrintableResult(props: any) {
    const componentRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef as any, // v3+
        documentTitle: `${props.student.name}_Result_${props.result.term}_${props.result.session.replace('/', '-')}`,
    });

    return (
        <div className="flex flex-col items-center gap-6 pb-20 w-full relative">
            {/* Floating Action Bar */}
            <div className="w-full flex justify-end max-w-[210mm] sticky top-4 z-50 px-2 sm:px-0">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex items-center justify-end w-full sm:w-auto">
                    <button
                        onClick={() => handlePrint()}
                        className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all w-full sm:w-auto border border-indigo-400/50"
                    >
                        <Printer className="w-5 h-5" />
                        Print / Download PDF
                    </button>
                </div>
            </div>

            <div className="shadow-2xl overflow-hidden rounded-md pointer-events-none sm:pointer-events-auto bg-white flex justify-center ring-4 ring-white/10 ring-offset-4 ring-offset-slate-900/50 mt-2">
                <ResultTemplate ref={componentRef} {...props} />
            </div>
        </div>
    );
}
