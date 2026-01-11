'use client';

import { motion } from 'framer-motion';
import { Shield, Zap, CreditCard, Users, BookOpen, Trash2 } from 'lucide-react';

const features = [
    {
        title: "Secure Vault",
        desc: "Advanced encryption protecting every grade from tampering.",
        icon: Shield,
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/10"
    },
    {
        title: "Pay-to-Unlock",
        desc: "Seamless monetization for school revenue via Paystack.",
        icon: CreditCard,
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10"
    },
    {
        title: "Instant Delivery",
        desc: "Results are available immediately after payment confirmation.",
        icon: Zap,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10"
    },
    {
        title: "Teacher Portal",
        desc: "Role-based access for teachers to manage their students.",
        icon: Users,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10"
    },
    {
        title: "School Blog",
        desc: "Built-in promotional tool for school news and updates.",
        icon: BookOpen,
        color: "text-rose-400",
        bgColor: "bg-rose-500/10"
    },
    {
        title: "Cascade Purge",
        desc: "One-click data cleanup for complete student lifecycle.",
        icon: Trash2,
        color: "text-slate-400",
        bgColor: "bg-slate-500/10"
    }
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-indigo-400 font-bold uppercase tracking-widest text-sm">Features</h2>
                    <p className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Everything you need to automate.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 transition-all hover:bg-slate-900 group"
                        >
                            <div className={`w-12 h-12 ${f.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                <f.icon className={`w-6 h-6 ${f.color}`} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
