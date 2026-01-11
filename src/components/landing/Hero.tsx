'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 -right-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center space-y-8 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 text-sm font-bold tracking-wide uppercase"
                    >
                        <Zap className="w-4 h-4" />
                        The Future of Academic experine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.1]"
                    >
                        City High Foundation <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">School..</span> <br/> school portal
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto"
                    >
                        Here in city high foundation school we are raising stars and making chanpions. and also keeping up with the technology age to make teaching and learing easier and more effective.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2"
                        >
                            Get Started Now
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/blog"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            Read Latest News
                        </Link>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-slate-900 mt-20"
                    >
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-white">3H+</p>
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Active Students</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-white">100%</p>
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Digital Security</p>
                        </div>
                        <div className="hidden md:block space-y-1">
                            <p className="text-3xl font-bold text-white">Fast</p>
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Instant Pay-Unlock</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
